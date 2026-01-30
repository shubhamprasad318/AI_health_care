"""
File Upload Routes
"""
from fastapi import APIRouter, HTTPException, Request, UploadFile, File
from fastapi.responses import FileResponse
from database.connection import db
from utils.security import require_auth
from utils.helpers import standard_response, allowed_file
from config.settings import UPLOAD_FOLDER, ALLOWED_EXTENSIONS, MAX_FILE_SIZE
from services.gemini_service import process_medical_report  # ✅ ADD THIS
from datetime import datetime
import logging
import aiofiles
import os
from pathlib import Path


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/files", tags=["Files"])


@router.post("/upload")
async def upload_file(request: Request, file: UploadFile = File(...)):
    """Upload a file"""
    try:
        email = await require_auth(request)
        
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        if not allowed_file(file.filename, ALLOWED_EXTENSIONS):
            raise HTTPException(
                status_code=400,
                detail=f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # Check file size
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Max size: {MAX_FILE_SIZE / 1024 / 1024}MB"
            )
        
        # Generate unique filename
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{email.split('@')[0]}_{timestamp}_{file.filename}"
        file_path = UPLOAD_FOLDER / safe_filename
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(contents)
        
        # ✅ Save file metadata with analysis fields
        file_data = {
            "email": email,
            "filename": file.filename,
            "stored_filename": safe_filename,
            "file_path": str(file_path),
            "file_size": len(contents),
            "content_type": file.content_type,
            "uploaded_at": datetime.utcnow(),
            "analyzed": False,  # ✅ ADD
            "analysis": None     # ✅ ADD
        }
        
        result = await db.files.insert_one(file_data)
        file_id = str(result.inserted_id)
        
        # ✅ AUTO-ANALYZE medical reports
        if file.content_type in ["application/pdf", "image/jpeg", "image/png", "image/jpg"]:
            try:
                logger.info(f"🔍 Auto-analyzing: {file.filename}")
                analysis = await process_medical_report(str(file_path), file.content_type)
                
                if analysis.get("success"):
                    await db.files.update_one(
                        {"_id": result.inserted_id},
                        {"$set": {
                            "analyzed": True,
                            "analysis": analysis.get("analysis", {})
                        }}
                    )
                    logger.info(f"✅ Analysis complete: {file.filename}")
                else:
                    logger.warning(f"⚠️ Analysis failed: {analysis.get('error')}")
            except Exception as e:
                logger.error(f"❌ Analysis error: {e}")
        
        return standard_response(
            message="File uploaded successfully",
            data={
                "file_id": file_id,
                "filename": file.filename,
                "size": len(contents)
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload file error: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload file")


# ✅ SPECIFIC ROUTES FIRST

@router.get("/metrics/history")
async def get_health_metrics_history(request: Request):
    """Get health metrics history from all analyzed reports"""
    try:
        email = await require_auth(request)
        
        # Get all analyzed files
        cursor = db.files.find({
            "email": email,
            "analyzed": True
        }).sort("uploaded_at", -1)
        
        files = await cursor.to_list(length=100)
        
        # Extract metrics timeline
        metrics_timeline = []
        
        for f in files:
            analysis = f.get("analysis", {})
            metrics = analysis.get("health_metrics", {})
            
            if metrics or analysis.get("key_findings"):
                metrics_timeline.append({
                    "date": f["uploaded_at"].isoformat(),
                    "report_type": analysis.get("report_type", "Unknown"),
                    "metrics": metrics,
                    "risk_level": analysis.get("risk_level", "Unknown"),
                    "key_findings": analysis.get("key_findings", []),
                    "abnormal_values": analysis.get("abnormal_values", []),
                    "file_id": str(f["_id"]),
                    "filename": f["filename"]
                })
        
        return standard_response(
            message="Metrics history retrieved",
            data={
                "timeline": metrics_timeline,
                "count": len(metrics_timeline)
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Metrics history error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get metrics history")


@router.get("")
async def get_files(request: Request):
    """Get user's uploaded files"""
    try:
        email = await require_auth(request)
        
        # Get files
        cursor = db.files.find({"email": email}).sort("uploaded_at", -1)
        files = await cursor.to_list(length=100)
        
        # Convert ObjectId and format data
        for f in files:
            f["_id"] = str(f["_id"])
            f["uploaded_at"] = f["uploaded_at"].isoformat()
        
        return standard_response(
            message="Files retrieved successfully",
            data={
                "files": files,
                "count": len(files)
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get files error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get files")


# ✅ ANALYSIS ROUTE - MUST BE BEFORE /{file_id}
@router.get("/{file_id}/analysis")
async def get_file_analysis(request: Request, file_id: str):
    """Get AI analysis of a medical report"""
    try:
        email = await require_auth(request)
        
        from bson import ObjectId
        
        # Get file
        file_doc = await db.files.find_one({
            "_id": ObjectId(file_id),
            "email": email
        })
        
        if not file_doc:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Check if already analyzed
        if file_doc.get("analyzed") and file_doc.get("analysis"):
            return standard_response(
                message="Analysis retrieved",
                data={
                    "analyzed": True,
                    "analysis": file_doc.get("analysis", {})
                }
            )
        
        # Analyze now if not done
        logger.info(f"🔍 Analyzing on-demand: {file_doc['filename']}")
        file_path = Path(file_doc["file_path"])
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found on disk")
        
        analysis = await process_medical_report(
            str(file_path),
            file_doc.get("content_type", "")
        )
        
        if not analysis.get("success"):
            raise HTTPException(
                status_code=500, 
                detail=analysis.get("error", "Analysis failed")
            )
        
        # Save analysis
        await db.files.update_one(
            {"_id": ObjectId(file_id)},
            {"$set": {
                "analyzed": True,
                "analysis": analysis.get("analysis", {})
            }}
        )
        
        logger.info(f"✅ Analysis complete: {file_doc['filename']}")
        
        return standard_response(
            message="Analysis complete",
            data=analysis
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze report")


# ✅ GENERIC ROUTE - MUST BE AFTER /{file_id}/analysis
@router.get("/{file_id}")
async def get_file(request: Request, file_id: str):
    """View/download a file"""
    try:
        email = await require_auth(request)
        
        from bson import ObjectId
        
        # Get file metadata
        file_doc = await db.files.find_one({
            "_id": ObjectId(file_id),
            "email": email
        })
        
        if not file_doc:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Get file path
        file_path = Path(file_doc["file_path"])
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found on disk")
        
        # Return file
        return FileResponse(
            path=str(file_path),
            media_type=file_doc.get("content_type", "application/octet-stream"),
            filename=file_doc["filename"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get file error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve file")


@router.delete("/{file_id}")
async def delete_file(request: Request, file_id: str):
    """Delete a file"""
    try:
        email = await require_auth(request)
        
        from bson import ObjectId
        
        # Get file metadata
        file_doc = await db.files.find_one({
            "_id": ObjectId(file_id),
            "email": email
        })
        
        if not file_doc:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Delete physical file
        file_path = Path(file_doc["file_path"])
        if file_path.exists():
            file_path.unlink()
        
        # Delete from database
        await db.files.delete_one({"_id": ObjectId(file_id)})
        
        logger.info(f"🗑️ File deleted: {file_doc['filename']}")
        
        return standard_response(message="File deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete file error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete file")
