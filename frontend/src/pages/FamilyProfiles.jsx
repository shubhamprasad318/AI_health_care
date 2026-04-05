import React, { useState, useEffect } from "react";
import { familyAPI } from "../utils/api";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUserFriends,
  FaPlus,
  FaEdit,
  FaTrash,
  FaAllergies,
  FaHeartbeat,
  FaPills,
  FaNotesMedical,
  FaTimes,
} from "react-icons/fa";

const RELATIONSHIPS = [
  { value: "spouse", label: "Spouse" },
  { value: "child", label: "Child" },
  { value: "parent", label: "Parent" },
  { value: "sibling", label: "Sibling" },
  { value: "grandparent", label: "Grandparent" },
  { value: "other", label: "Other" },
];

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const RELATIONSHIP_EMOJI = {
  spouse: "\u{1F491}",
  child: "\u{1F476}",
  parent: "\u{1F9D1}",
  sibling: "\u{1F46F}",
  grandparent: "\u{1F9D3}",
  other: "\u{1F464}",
};

const emptyForm = {
  name: "",
  relationship: "spouse",
  age: "",
  gender: "",
  blood_type: "",
  allergies: "",
  conditions: "",
  medications: "",
  notes: "",
};

export default function FamilyProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const res = await familyAPI.list();
      if (res.success) {
        setProfiles(res.data?.profiles || []);
      }
    } catch (err) {
      toast.error("Failed to load family profiles");
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (profile) => {
    setEditingId(profile._id);
    setForm({
      name: profile.name || "",
      relationship: profile.relationship || "spouse",
      age: profile.age ?? "",
      gender: profile.gender || "",
      blood_type: profile.blood_type || "",
      allergies: (profile.allergies || []).join(", "),
      conditions: (profile.conditions || []).join(", "),
      medications: (profile.medications || []).join(", "),
      notes: profile.notes || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        relationship: form.relationship,
        age: form.age ? parseInt(form.age) : null,
        gender: form.gender || null,
        blood_type: form.blood_type || null,
        allergies: form.allergies
          ? form.allergies.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        conditions: form.conditions
          ? form.conditions.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        medications: form.medications
          ? form.medications.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        notes: form.notes.trim() || null,
      };

      if (editingId) {
        const res = await familyAPI.update(editingId, payload);
        if (res.success) {
          toast.success("Profile updated");
          setShowModal(false);
          fetchProfiles();
        }
      } else {
        const res = await familyAPI.create(payload);
        if (res.success) {
          toast.success("Family member added");
          setShowModal(false);
          fetchProfiles();
        }
      }
    } catch (err) {
      toast.error(err.message || "Failed to save profile");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name}'s profile? This cannot be undone.`)) return;

    try {
      const res = await familyAPI.delete(id);
      if (res.success) {
        toast.success("Profile deleted");
        fetchProfiles();
      }
    } catch (err) {
      toast.error("Failed to delete profile");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pb-20 transition-colors duration-300">
      <div className="bg-gradient-to-r from-btn2 to-btn1 text-white py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <FaUserFriends className="text-3xl" />
            <h1 className="text-3xl md:text-4xl font-bold">Family Profiles</h1>
          </div>
          <p className="text-blue-100 text-lg">
            Manage health information for your family members
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/50 p-6 mb-8 animate-fadeIn dark:border dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-btn2">{profiles.length}</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Members</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-500">
                  {profiles.reduce(
                    (acc, p) => acc + (p.conditions?.length || 0),
                    0
                  )}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Conditions Tracked</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-500">
                  {profiles.reduce(
                    (acc, p) => acc + (p.medications?.length || 0),
                    0
                  )}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Medications</p>
              </div>
            </div>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 bg-gradient-to-r from-btn2 to-btn1 text-white px-5 py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
            >
              <FaPlus /> Add Member
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-btn2 border-t-transparent"></div>
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-20 animate-fadeIn">
            <FaUserFriends className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-600 dark:text-gray-300 mb-2">
              No family profiles yet
            </h3>
            <p className="text-gray-400 dark:text-gray-500 mb-6">
              Add family members to track their health information
            </p>
            <button
              onClick={openAdd}
              className="bg-gradient-to-r from-btn2 to-btn1 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
            >
              Add First Member
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => (
              <motion.div
                key={profile._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 hover:shadow-xl transition-all overflow-hidden"
              >
                <div className="bg-gradient-to-r from-btn2/10 to-sky-500/10 dark:from-btn2/20 dark:to-sky-500/20 p-5">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">
                        {RELATIONSHIP_EMOJI[profile.relationship] || "\u{1F464}"}
                      </span>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                          {profile.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {profile.relationship}
                          {profile.age ? ` \u2022 ${profile.age} yrs` : ""}
                          {profile.gender ? ` \u2022 ${profile.gender}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(profile)}
                        className="p-2 text-gray-400 hover:text-btn2 hover:bg-btn2/10 rounded-lg transition-all"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(profile._id, profile.name)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  {profile.blood_type && (
                    <span className="inline-block mt-2 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-semibold">
                      Blood: {profile.blood_type}
                    </span>
                  )}
                </div>

                <div className="p-5 space-y-3">
                  {profile.allergies?.length > 0 && (
                    <div className="flex items-start gap-2">
                      <FaAllergies className="text-orange-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          Allergies
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {profile.allergies.map((a, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 rounded-full text-xs"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {profile.conditions?.length > 0 && (
                    <div className="flex items-start gap-2">
                      <FaHeartbeat className="text-red-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          Conditions
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {profile.conditions.map((c, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 rounded-full text-xs"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {profile.medications?.length > 0 && (
                    <div className="flex items-start gap-2">
                      <FaPills className="text-purple-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          Medications
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {profile.medications.map((m, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 rounded-full text-xs"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {profile.notes && (
                    <div className="flex items-start gap-2">
                      <FaNotesMedical className="text-blue-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          Notes
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {profile.notes}
                        </p>
                      </div>
                    </div>
                  )}

                  {!profile.allergies?.length &&
                    !profile.conditions?.length &&
                    !profile.medications?.length &&
                    !profile.notes && (
                      <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-2">
                        No health details added yet
                      </p>
                    )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:shadow-gray-900/50 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  {editingId ? "Edit Member" : "Add Family Member"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                >
                  <FaTimes className="text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-btn2 focus:outline-none transition-all dark:bg-gray-700/50 dark:text-gray-100"
                      placeholder="Full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Relationship *
                    </label>
                    <select
                      value={form.relationship}
                      onChange={(e) =>
                        setForm({ ...form, relationship: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-btn2 focus:outline-none transition-all dark:bg-gray-700/50 dark:text-gray-100"
                    >
                      {RELATIONSHIPS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      value={form.age}
                      onChange={(e) =>
                        setForm({ ...form, age: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-btn2 focus:outline-none transition-all dark:bg-gray-700/50 dark:text-gray-100"
                      min="0"
                      max="150"
                      placeholder="Age"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Gender
                    </label>
                    <select
                      value={form.gender}
                      onChange={(e) =>
                        setForm({ ...form, gender: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-btn2 focus:outline-none transition-all dark:bg-gray-700/50 dark:text-gray-100"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Blood Type
                    </label>
                    <select
                      value={form.blood_type}
                      onChange={(e) =>
                        setForm({ ...form, blood_type: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-btn2 focus:outline-none transition-all dark:bg-gray-700/50 dark:text-gray-100"
                    >
                      <option value="">Select</option>
                      {BLOOD_TYPES.map((bt) => (
                        <option key={bt} value={bt}>
                          {bt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Allergies
                    </label>
                    <input
                      type="text"
                      value={form.allergies}
                      onChange={(e) =>
                        setForm({ ...form, allergies: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-btn2 focus:outline-none transition-all dark:bg-gray-700/50 dark:text-gray-100"
                      placeholder="Comma-separated (e.g. Peanuts, Penicillin)"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Medical Conditions
                    </label>
                    <input
                      type="text"
                      value={form.conditions}
                      onChange={(e) =>
                        setForm({ ...form, conditions: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-btn2 focus:outline-none transition-all dark:bg-gray-700/50 dark:text-gray-100"
                      placeholder="Comma-separated (e.g. Diabetes, Asthma)"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Current Medications
                    </label>
                    <input
                      type="text"
                      value={form.medications}
                      onChange={(e) =>
                        setForm({ ...form, medications: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-btn2 focus:outline-none transition-all dark:bg-gray-700/50 dark:text-gray-100"
                      placeholder="Comma-separated (e.g. Metformin, Aspirin)"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={(e) =>
                        setForm({ ...form, notes: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-btn2 focus:outline-none transition-all resize-none"
                      rows="3"
                      placeholder="Additional health notes..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-btn2 to-btn1 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {submitting
                      ? "Saving..."
                      : editingId
                      ? "Update"
                      : "Add Member"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
