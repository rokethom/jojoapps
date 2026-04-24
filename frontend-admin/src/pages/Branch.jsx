import { useState, useEffect } from "react";
import api from "../api/axios";
import {
  FiGitBranch, FiMapPin, FiRefreshCw, FiSearch, FiX,
  FiNavigation, FiMap, FiPlus, FiEdit2, FiTrash2,
  FiCheckCircle, FiAlertCircle,
} from "react-icons/fi";

export default function Branch() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  /* Modal states */
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formName, setFormName] = useState("");
  const [formArea, setFormArea] = useState("");
  const [formLat, setFormLat] = useState("");
  const [formLng, setFormLng] = useState("");

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await api.get("branch/list/");
      const data = res.data.branches || res.data || [];
      setBranches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch branches", err);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openCreateModal = () => {
    setEditingBranch(null);
    setFormName("");
    setFormArea("");
    setFormLat("");
    setFormLng("");
    setShowModal(true);
  };

  const openEditModal = (branch) => {
    setEditingBranch(branch);
    setFormName(branch.name || "");
    setFormArea(branch.area || "");
    setFormLat(branch.latitude || "");
    setFormLng(branch.longitude || "");
    setShowModal(true);
  };

  const handleSave = async () => {
    const payload = {
      name: formName,
      area: formArea,
      latitude: formLat ? parseFloat(formLat) : null,
      longitude: formLng ? parseFloat(formLng) : null,
    };
    try {
      if (editingBranch) {
        await api.patch(`branch/${editingBranch.id}/`, payload);
        showToast("Branch updated!");
      } else {
        await api.post("branch/", payload);
        showToast("Branch created!");
      }
      setShowModal(false);
      fetchBranches();
    } catch (err) {
      showToast("Failed to save branch", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this branch?")) return;
    try {
      await api.delete(`branch/${id}/`);
      showToast("Branch deleted!");
      fetchBranches();
    } catch (err) {
      showToast("Failed to delete branch", "error");
    }
  };

  const filtered = branches.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (b.name || "").toLowerCase().includes(q) ||
      (b.area || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="animate-fade-in" style={pageWrap}>
      {/* TOAST */}
      {toast && (
        <div style={{
          ...toastStyle,
          background: toast.type === "error" ? "var(--badge-cancelled-bg)" : "var(--badge-delivery-bg)",
          color: toast.type === "error" ? "var(--badge-cancelled-color)" : "var(--badge-delivery-color)",
          borderColor: toast.type === "error" ? "var(--badge-cancelled-color)" : "var(--badge-delivery-color)",
        }}>
          {toast.type === "error" ? <FiAlertCircle /> : <FiCheckCircle />}
          {toast.msg}
        </div>
      )}

      {/* HEADER */}
      <div style={header}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.8rem", color: "var(--text-heading)", letterSpacing: "-0.02em" }}>Branch Management</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: 15 }}>
            {branches.length} branches registered
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={refreshBtn} onClick={fetchBranches}>
            <FiRefreshCw /> Refresh
          </button>
          <button style={addBtn} onClick={openCreateModal}>
            <FiPlus /> Add Branch
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <div style={searchRow}>
        <div style={searchBox}>
          <FiSearch style={{ color: "var(--text-muted)" }} />
          <input
            placeholder="Search by name or area..."
            style={searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <FiX style={{ cursor: "pointer", color: "var(--text-muted)" }} onClick={() => setSearch("")} />
          )}
        </div>
      </div>

      {/* CARDS GRID */}
      {loading ? (
        <div style={loadingBox}>
          <div style={spinnerStyle}></div>
          <style>{`@keyframes branchSpin{to{transform:rotate(360deg)}}`}</style>
          <p style={{ color: "var(--text-muted)" }}>Loading branches...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={emptyBox}>
          <FiGitBranch size={48} style={{ color: "var(--text-muted)" }} />
          <p style={{ color: "var(--text-muted)", marginTop: 12 }}>No branches found</p>
        </div>
      ) : (
        <div style={cardsGrid}>
          {filtered.map((branch, i) => (
            <BranchCard
              key={branch.id}
              branch={branch}
              onEdit={() => openEditModal(branch)}
              onDelete={() => handleDelete(branch.id)}
              delay={i % 5}
            />
          ))}
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div style={modalOverlay} onClick={() => setShowModal(false)}>
          <div style={modalCard} onClick={(e) => e.stopPropagation()} className="animate-fade-in-up">
            <h3 style={{ margin: "0 0 20px", color: "var(--text-heading)" }}>
              {editingBranch ? "Edit Branch" : "Add New Branch"}
            </h3>

            <div style={fieldGroup}>
              <label style={labelStyle}>Branch Name</label>
              <input
                style={inputStyle}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Jojango Pusat"
              />
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>Area / City</label>
              <input
                style={inputStyle}
                value={formArea}
                onChange={(e) => setFormArea(e.target.value)}
                placeholder="e.g. Kota Tasikmalaya"
              />
            </div>

            <div style={formRow}>
              <div style={fieldGroup}>
                <label style={labelStyle}>Latitude</label>
                <input
                  style={inputStyle}
                  value={formLat}
                  onChange={(e) => setFormLat(e.target.value)}
                  placeholder="-6.xxxxx"
                />
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>Longitude</label>
                <input
                  style={inputStyle}
                  value={formLng}
                  onChange={(e) => setFormLng(e.target.value)}
                  placeholder="108.xxxxx"
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <button style={cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={saveModalBtn} onClick={handleSave}>
                {editingBranch ? "Save Changes" : "Create Branch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= COMPONENTS ================= */

function BranchCard({ branch, onEdit, onDelete, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        ...branchCardStyle,
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? "var(--shadow-md)" : "var(--shadow-sm)",
      }}
      className={`animate-fade-in-up delay-${delay}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={cardHeader}>
        <div style={branchIcon}>
          <FiGitBranch size={20} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={iconBtn} onClick={onEdit} title="Edit">
            <FiEdit2 size={14} />
          </button>
          <button style={{ ...iconBtn, color: "var(--danger)" }} onClick={onDelete} title="Delete">
            <FiTrash2 size={14} />
          </button>
        </div>
      </div>

      <h3 style={{ margin: "16px 0 4px", fontSize: 18, fontWeight: 700, color: "var(--text-heading)" }}>
        {branch.name}
      </h3>

      <div style={cardInfo}>
        <FiMapPin size={13} style={{ color: "var(--text-muted)" }} />
        <span>{branch.area || "—"}</span>
      </div>

      {(branch.latitude || branch.longitude) && (
        <div style={coordsRow}>
          <div style={coordChip}>
            <FiNavigation size={11} />
            <span>Lat: {branch.latitude || "—"}</span>
          </div>
          <div style={coordChip}>
            <FiMap size={11} />
            <span>Lng: {branch.longitude || "—"}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= STYLES — fully themed ================= */

const pageWrap = { padding: 10, position: "relative" };

const header = {
  display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28,
};

const refreshBtn = {
  display: "flex", alignItems: "center", gap: 6,
  background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10,
  padding: "8px 16px", cursor: "pointer", fontWeight: 500, fontSize: 13, color: "var(--text-secondary)",
  transition: "all 0.15s ease",
};

const addBtn = {
  display: "flex", alignItems: "center", gap: 6,
  background: "var(--success)", border: "none", borderRadius: 10,
  padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#fff",
  transition: "opacity 0.15s ease",
};

const searchRow = { marginBottom: 24 };

const searchBox = {
  display: "flex", alignItems: "center", gap: 10,
  background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 12,
  padding: "10px 16px", maxWidth: 400,
  transition: "all 0.15s ease",
};

const searchInput = {
  border: "none", outline: "none", background: "transparent",
  flex: 1, fontSize: 14, color: "var(--text-primary)",
};

const toastStyle = {
  position: "fixed", top: 24, right: 24, zIndex: 999,
  display: "flex", alignItems: "center", gap: 8,
  padding: "12px 20px", borderRadius: 12, fontSize: 14, fontWeight: 500,
  border: "1px solid", boxShadow: "var(--shadow-lg)",
  animation: "fadeIn 0.3s ease",
};

/* Cards Grid */
const cardsGrid = {
  display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20,
};

const branchCardStyle = {
  background: "var(--bg-card)", borderRadius: 20, padding: 24,
  border: "1px solid var(--card-border)",
  boxShadow: "var(--shadow-sm)",
  transition: "all 0.2s ease",
};

const cardHeader = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
};

const branchIcon = {
  width: 44, height: 44, borderRadius: 14,
  background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(52,211,153,0.15))",
  color: "var(--success)",
  display: "flex", alignItems: "center", justifyContent: "center",
};

const iconBtn = {
  background: "none", border: "none", cursor: "pointer",
  color: "var(--text-muted)", padding: 6, borderRadius: 8, fontSize: 14,
  transition: "color 0.15s ease",
};

const cardInfo = {
  display: "flex", alignItems: "center", gap: 6,
  fontSize: 14, color: "var(--text-secondary)", marginBottom: 12,
};

const coordsRow = {
  display: "flex", gap: 8, marginTop: 8,
};

const coordChip = {
  display: "inline-flex", alignItems: "center", gap: 4,
  fontSize: 11, color: "var(--text-secondary)", background: "var(--bg-input)",
  padding: "4px 10px", borderRadius: 8, border: "1px solid var(--border-light)",
};

/* Modal */
const modalOverlay = {
  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
  background: "rgba(0,0,0,0.5)", display: "flex",
  alignItems: "center", justifyContent: "center", zIndex: 1000,
  backdropFilter: "blur(4px)",
};

const modalCard = {
  background: "var(--bg-card)", borderRadius: 20, padding: 32,
  width: 480, maxWidth: "90vw",
  boxShadow: "var(--shadow-lg)",
  border: "1px solid var(--card-border)",
};

const fieldGroup = { marginBottom: 16 };

const formRow = {
  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
};

const labelStyle = {
  display: "block", fontSize: 13, fontWeight: 500,
  color: "var(--text-secondary)", marginBottom: 6,
};

const inputStyle = {
  width: "100%", padding: "12px 16px", borderRadius: 12,
  border: "1px solid var(--border)", fontSize: 14, color: "var(--text-primary)",
  outline: "none", background: "var(--bg-input)", boxSizing: "border-box",
  transition: "border-color 0.15s ease",
};

const cancelBtn = {
  padding: "10px 20px", borderRadius: 10, border: "1px solid var(--border)",
  background: "var(--bg-card)", cursor: "pointer", fontWeight: 500, fontSize: 13, color: "var(--text-secondary)",
  transition: "all 0.15s ease",
};

const saveModalBtn = {
  padding: "10px 20px", borderRadius: 10, border: "none",
  background: "var(--success)", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#fff",
  transition: "opacity 0.15s ease",
};

/* Empty / Loading */
const spinnerStyle = {
  width: 36, height: 36, border: "4px solid var(--border)",
  borderTopColor: "var(--success)", borderRadius: "50%",
  animation: "branchSpin 0.8s linear infinite", marginBottom: 14,
};

const loadingBox = {
  display: "flex", flexDirection: "column", alignItems: "center",
  justifyContent: "center", height: 300, color: "var(--text-muted)",
};

const emptyBox = {
  display: "flex", flexDirection: "column", alignItems: "center",
  justifyContent: "center", height: 300,
  background: "var(--bg-card)", borderRadius: 20, border: "1px solid var(--card-border)",
};
