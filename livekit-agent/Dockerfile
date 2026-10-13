# syntax=docker/dockerfile:1

ARG PYTHON_VERSION=3.11

FROM python:${PYTHON_VERSION}-slim AS builder

ENV PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc \
        g++ \
        python3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

COPY requirements.txt ./
RUN pip install --prefix=/install --no-cache-dir -r requirements.txt


FROM python:${PYTHON_VERSION}-slim AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONFAULTHANDLER=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

ARG UID=10001
RUN adduser \
        --disabled-password \
        --gecos "" \
        --home "/app" \
        --shell "/sbin/nologin" \
        --uid "${UID}" \
        appuser

COPY --from=builder /install /usr/local

WORKDIR /app

COPY . .

# Pre-warm the Silero VAD model so the first job doesn't pay download latency.
# If the download fails, the container should still start; runtime will retry.
RUN python -c "from livekit.plugins import silero; silero.VAD.load()" || true

RUN chown -R appuser:appuser /app

USER appuser

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import sys; sys.exit(0)"

# Run unbuffered for clean log streaming. exec form ensures SIGTERM reaches Python.
CMD ["python", "-u", "agent.py", "start"]
