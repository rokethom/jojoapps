import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import {
  FiUsers, FiSearch, FiX, FiRefreshCw, FiUser,
  FiPhone, FiMapPin, FiShield, FiChevronDown, FiChevronUp,
  FiMail, FiGitBranch, FiEdit, FiTrash2,
} from "react-icons/fi";

const ROLE_LIST = ["all", "admin", "gm", "hrd", "manager", "spv", "operator", "driver", "customer"];

const ROLE_CONFIG = {
  admin:    { bg: "var(--badge-pending-bg)",   color: "var(--badge-pending-color)",   label: "Admin" },
  gm:       { bg: "var(--badge-assigned-bg)",  color: "var(--badge-assigned-color)",  label: "GM" },
  hrd:      { bg: "rgba(236,72,153,0.12)",     color: "#ec4899",                      label: "HRD" },
  manager:  { bg: "var(--badge-assigned-bg)",  color: "var(--badge-assigned-color)",  label: "Manager" },
  spv:      { bg: "var(--accent-glow)",        color: "var(--accent)",                label: "SPV" },
  operator: { bg: "var(--badge-delivery-bg)",  color: "var(--badge-delivery-color)",  label: "Operator" },
  driver:   { bg: "rgba(59,130,246,0.12)",     color: "var(--info)",                  label: "Driver" },
  customer: { bg: "var(--badge-done-bg)",      color: "var(--badge-done-color)",      label: "Customer" },
};

export default function Users() {
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(searchParams.get('role') || "all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [userModal, setUserModal] = useState(null);
  const [suspendModal, setSuspendModal] = useState(null);
  const [userForm, setUserForm] = useState({
    username: "", email: "", name: "", phone: "", role: "customer", branch: ""
  });
  const [suspendForm, setSuspendForm] = useState({
    duration_hours: 1,
    reason: ""
  });
  const [actionLoading, setActionLoading] = useState(null);
  const [notification, setNotification] = useState("");

  useEffect(() => {
    if (!notification) return;
    const timeout = window.setTimeout(() => setNotification(""), 6000);
    return () => window.clearTimeout(timeout);
  }, [notification]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Build query params
      const params = new URLSearchParams();
      if (filter !== "all") params.append("role", filter);
      if (search) params.append("search", search);
      
      // Add suspended filter from URL params
      const suspendedParam = searchParams.get('suspended');
      if (suspendedParam) params.append("suspended", suspendedParam);
      
      const queryString = params.toString();
      const url = `auth/users/${queryString ? `?${queryString}` : ""}`;
      
      const res = await api.get(url);
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setUsers(data);
      const cleared = res.headers?.["x-expired-suspensions-cleared"] || res.headers?.["X-Expired-Suspensions-Cleared"];
      if (cleared && Number(cleared) > 0) {
        setNotification(`${cleared} driver suspension${Number(cleared) === 1 ? " has" : "s have"} expired and were cleared automatically.`);
      } else {
        setNotification("");
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
      // Fallback: try the me endpoint to at least show current user
      try {
        const me = await api.get("auth/me/");
        setUsers([me.data]);
      } catch {
        setUsers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search]);

  /* ---- CRUD Operations ---- */
  const handleAddUser = () => {
    setUserModal({ mode: "add" });
    setUserForm({
      username: "", email: "", name: "", phone: "", role: "customer", branch: ""
    });
  };

  const handleEditUser = (user) => {
    setUserModal({ mode: "edit", user });
    setUserForm({
      username: user.username || "",
      email: user.email || "",
      name: user.name || "",
      phone: user.phone || "",
      role: user.role || "customer",
      branch: user.branch || ""
    });
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setActionLoading(userId);
      try {
        await api.delete(`auth/users/${userId}/`);
        fetchUsers();
      } catch (err) {
        alert("Failed to delete user: " + (err.response?.data?.error || err.message));
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleUnsuspendUser = async (userId) => {
    if (!window.confirm("Unsuspend this driver?")) return;
    setActionLoading(userId);
    try {
      await api.post(`auth/users/${userId}/unsuspend/`);
      fetchUsers();
    } catch (err) {
      alert("Failed to unsuspend user: " + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendUser = async (userId, duration, reason) => {
    setActionLoading(userId);
    try {
      await api.post(`auth/users/${userId}/suspend/`, {
        duration_hours: duration,
        reason: reason
      });
      fetchUsers();
    } catch (err) {
      alert("Failed to suspend user: " + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveUser = async () => {
    if (!userForm.username || !userForm.email) {
      alert("Username and email are required");
      return;
    }

    setActionLoading("save");
    try {
      if (userModal.mode === "add") {
        await api.post("auth/users/", userForm);
      } else {
        await api.put(`auth/users/${userModal.user.id}/`, userForm);
      }
      setUserModal(null);
      fetchUsers();
    } catch (err) {
      alert(`Failed to ${userModal.mode} user: ` + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users
    .filter((u) => (filter === "all" ? true : u.role === filter))
    .filter((u) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (u.name || u.username || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.phone || "").toLowerCase().includes(q) ||
        (u.role || "").toLowerCase().includes(q)
      );
    });

  const counts = {};
  ROLE_LIST.forEach((r) => {
    counts[r] = r === "all" ? users.length : users.filter((u) => u.role === r).length;
  });

  return (
    <div className="animate-fade-in" style={pageWrap}>
      {/* HEADER */}
      <div style={header}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.8rem", color: "var(--text-heading)", letterSpacing: "-0.02em" }}>User Management</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: 15 }}>
            {users.length} registered users
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, flexDirection: "column", alignItems: "flex-end" }}>
          {notification && (
            <div style={notificationBox}>{notification}</div>
          )}
          <div style={{ display: "flex", gap: 12 }}>
            <button style={addUserBtn} onClick={handleAddUser}>
              <FiUser /> Add User
            </button>
            <button style={refreshBtn} onClick={fetchUsers}>
              <FiRefreshCw /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ROLE FILTER */}
      <div style={filterRow}>
        {ROLE_LIST.map((r) => (
          <button
            key={r}
            style={{
              ...filterTab,
              ...(filter === r ? filterTabActive : {}),
            }}
            onClick={() => setFilter(r)}
          >
            {r === "all" ? "All" : ROLE_CONFIG[r]?.label || r}{" "}
            <span style={{
              ...countBadge,
              ...(filter === r ? countBadgeActive : {}),
            }}>{counts[r]}</span>
          </button>
        ))}
      </div>

      {/* SEARCH */}
      <div style={searchRow}>
        <div style={searchBox}>
          <FiSearch style={{ color: "var(--text-muted)" }} />
          <input
            placeholder="Search by name, email, phone, role..."
            style={searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <FiX style={{ cursor: "pointer", color: "var(--text-muted)" }} onClick={() => setSearch("")} />
          )}
        </div>
      </div>

      {/* TABLE */}
      {loading ? (
        <div style={loadingBox}>
          <div style={spinnerStyle}></div>
          <style>{`@keyframes userSpin{to{transform:rotate(360deg)}}`}</style>
          <p style={{ color: "var(--text-muted)" }}>Loading users...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={emptyBox}>
          <FiUsers size={48} style={{ color: "var(--text-muted)" }} />
          <p style={{ color: "var(--text-muted)", marginTop: 12 }}>No users found</p>
        </div>
      ) : (
        <div style={tableCard}>
          <table style={tableStyle}>
            <thead>
              <tr>
                {["ID", "Name", "Email", "Phone", "Role", "Branch", "Status", ""].map((h, i) => (
                  <th key={i} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  expanded={expandedId === user.id}
                  onToggle={() => setExpandedId(expandedId === user.id ? null : user.id)}
                  onEdit={() => handleEditUser(user)}
                  onDelete={() => handleDeleteUser(user.id)}
                  onUnsuspend={() => handleUnsuspendUser(user.id)}
                  onSuspend={() => setSuspendModal(user)}
                  actionLoading={actionLoading}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* USER MODAL */}
      {userModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <div style={modalHeader}>
              <h3 style={{ margin: 0, color: "var(--text-heading)" }}>
                {userModal.mode === "add" ? "Add New User" : "Edit User"}
              </h3>
              <button style={modalCloseBtn} onClick={() => setUserModal(null)}>
                <FiX size={18} />
              </button>
            </div>
            <div style={modalBody}>
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <label style={formLabel}>Username *</label>
                  <input
                    type="text"
                    style={modalInput}
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <label style={formLabel}>Email *</label>
                  <input
                    type="email"
                    style={modalInput}
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <label style={formLabel}>Full Name</label>
                  <input
                    type="text"
                    style={modalInput}
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label style={formLabel}>Phone</label>
                  <input
                    type="text"
                    style={modalInput}
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label style={formLabel}>Role</label>
                  <select
                    style={modalInput}
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  >
                    {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={formLabel}>Branch</label>
                  <input
                    type="text"
                    style={modalInput}
                    value={userForm.branch}
                    onChange={(e) => setUserForm({ ...userForm, branch: e.target.value })}
                    placeholder="Enter branch name"
                  />
                </div>
              </div>
              <div style={modalActions}>
                <button style={modalCancelBtn} onClick={() => setUserModal(null)}>
                  Cancel
                </button>
                <button
                  style={modalSaveBtn}
                  onClick={handleSaveUser}
                  disabled={actionLoading === "save"}
                >
                  {actionLoading === "save" ? "Saving..." : userModal.mode === "add" ? "Add User" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {suspendModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <div style={modalHeader}>
              <h3 style={{ margin: 0, color: "var(--text)" }}>Suspend Driver</h3>
              <button style={modalCloseBtn} onClick={() => setSuspendModal(null)}>
                <FiX />
              </button>
            </div>
            <div style={modalBody}>
              <p style={{ marginBottom: 16, color: "var(--text)" }}>
                Suspend <strong>{suspendModal.first_name || suspendModal.username}</strong>
              </p>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
                  Duration (hours)
                </label>
                <select
                  value={suspendForm.duration_hours}
                  onChange={(e) => setSuspendForm({...suspendForm, duration_hours: parseInt(e.target.value)})}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    background: "var(--bg)",
                    color: "var(--text)",
                  }}
                >
                  <option value={1}>1 hour</option>
                  <option value={2}>2 hours</option>
                  <option value={4}>4 hours</option>
                  <option value={8}>8 hours</option>
                  <option value={12}>12 hours</option>
                  <option value={24}>24 hours</option>
                  <option value={48}>48 hours</option>
                  <option value={72}>72 hours</option>
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
                  Reason
                </label>
                <textarea
                  value={suspendForm.reason}
                  onChange={(e) => setSuspendForm({...suspendForm, reason: e.target.value})}
                  placeholder="Enter suspension reason..."
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    background: "var(--bg)",
                    color: "var(--text)",
                    minHeight: 80,
                    resize: "vertical",
                  }}
                />
              </div>
            </div>
            <div style={modalActions}>
              <button style={modalCancelBtn} onClick={() => setSuspendModal(null)}>
                Cancel
              </button>
              <button
                style={modalSaveBtn}
                onClick={() => {
                  handleSuspendUser(suspendModal.id, suspendForm.duration_hours, suspendForm.reason);
                  setSuspendModal(null);
                  setSuspendForm({ duration_hours: 1, reason: "" });
                }}
                disabled={actionLoading === suspendModal.id}
              >
                {actionLoading === suspendModal.id ? "Suspending..." : "Suspend Driver"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= COMPONENTS ================= */

function UserRow({ user, expanded, onToggle, onEdit, onDelete, onUnsuspend, onSuspend, actionLoading }) {
  const rc = ROLE_CONFIG[user.role] || ROLE_CONFIG.customer;
  const displayName = user.name || user.first_name || user.username || "—";
  const branchName = user.branch?.name || user.branch_name || "—";

  return (
    <>
      <tr style={trStyle} onClick={onToggle}>
        <td style={td}>
          <span style={{ fontWeight: 600, color: "var(--text-muted)" }}>#{user.id}</span>
        </td>
        <td style={td}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ ...avatarCircle, backgroundColor: rc.bg, color: rc.color }}>
              <FiUser size={14} />
            </div>
            <div>
              <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{displayName}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>@{user.username || "—"}</div>
            </div>
          </div>
        </td>
        <td style={td}>
          <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>{user.email || "—"}</span>
        </td>
        <td style={td}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--text-secondary)" }}>
            <FiPhone size={11} /> {user.phone || "—"}
          </span>
        </td>
        <td style={td}>
          <span style={{ ...badgeStyle, backgroundColor: rc.bg, color: rc.color }}>
            {rc.label}
          </span>
        </td>
        <td style={td}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-secondary)" }}>
            <FiGitBranch size={11} /> {branchName}
          </span>
        </td>
        <td style={td}>
          <span style={{
            ...badgeStyle,
            backgroundColor: user.is_active !== false ? "var(--badge-delivery-bg)" : "var(--badge-cancelled-bg)",
            color: user.is_active !== false ? "var(--badge-delivery-color)" : "var(--badge-cancelled-color)",
          }}>
            {user.is_active !== false ? "Active" : "Inactive"}
          </span>
        </td>
        <td style={td}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              style={editBtn}
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              disabled={actionLoading === user.id}
            >
              <FiEdit size={14} />
            </button>
            <button
              style={deleteBtn}
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              disabled={actionLoading === user.id}
            >
              <FiTrash2 size={14} />
            </button>
            {user.role === 'driver' && user.is_suspended && (
              <button
                style={{
                  ...editBtn,
                  background: "var(--success)",
                }}
                onClick={(e) => { e.stopPropagation(); onUnsuspend(); }}
                disabled={actionLoading === user.id}
                title="Unsuspend driver"
              >
                <FiShield size={14} />
              </button>
            )}
            {user.role === 'driver' && !user.is_suspended && (
              <button
                style={{
                  ...editBtn,
                  background: "#f59e0b",
                }}
                onClick={(e) => { e.stopPropagation(); onSuspend(); }}
                disabled={actionLoading === user.id}
                title="Suspend driver"
              >
                <FiShield size={14} />
              </button>
            )}
            <button style={expandBtn} onClick={(e) => { e.stopPropagation(); onToggle(); }}>
              {expanded ? <FiChevronUp /> : <FiChevronDown />}
            </button>
          </div>
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={8} style={{ padding: 0 }}>
            <div style={detailWrap}>
              <div style={detailGrid}>
                <DetailItem icon={<FiUser />} label="Full Name" value={displayName} />
                <DetailItem icon={<FiMail />} label="Email" value={user.email || "—"} />
                <DetailItem icon={<FiPhone />} label="Phone" value={user.phone || "—"} />
                <DetailItem icon={<FiShield />} label="Role" value={rc.label} />
                <DetailItem icon={<FiGitBranch />} label="Branch" value={branchName} />
                <DetailItem icon={<FiMapPin />} label="Address" value={user.address || "—"} />
                {user.role === 'driver' && (
                  <>
                    <DetailItem icon={<FiShield />} label="Suspension" value={user.is_suspended ? "Suspended" : "Active"} />
                    {user.is_suspended && (
                      <>
                        <DetailItem icon={<FiShield />} label="Reason" value={user.suspension_reason || "—"} />
                        <DetailItem icon={<FiShield />} label="Until" value={user.suspended_until ? new Date(user.suspended_until).toLocaleString() : "—"} />
                        <DetailItem icon={<FiShield />} label="Oper Handle Count" value={user.oper_handle_count || 0} />
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function DetailItem({ icon, label, value }) {
  return (
    <div style={detailItemStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 12, marginBottom: 4 }}>
        {icon} {label}
      </div>
      <div style={{ fontWeight: 500, color: "var(--text-primary)", fontSize: 14 }}>{value}</div>
    </div>
  );
}

/* ================= STYLES — fully themed ================= */

const pageWrap = { padding: 10 };

const header = {
  display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28,
};

const refreshBtn = {
  display: "flex", alignItems: "center", gap: 6,
  background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10,
  padding: "8px 16px", cursor: "pointer", fontWeight: 500, fontSize: 13, color: "var(--text-secondary)",
  transition: "all 0.15s ease",
};

const addUserBtn = {
  display: "flex", alignItems: "center", gap: 6,
  background: "var(--success)", border: "none", borderRadius: 10,
  padding: "8px 16px", cursor: "pointer", fontWeight: 500, fontSize: 13, color: "#fff",
  transition: "all 0.15s ease",
};

const notificationBox = {
  background: "rgba(16, 185, 129, 0.12)",
  color: "#10b981",
  border: "1px solid rgba(16, 185, 129, 0.24)",
  padding: "10px 14px",
  borderRadius: 12,
  fontSize: 13,
  maxWidth: 360,
  textAlign: "right",
};

const filterRow = {
  display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap",
};

const filterTab = {
  padding: "6px 14px", borderRadius: 20, border: "1px solid var(--border)",
  background: "var(--bg-card)", cursor: "pointer", fontSize: 12, fontWeight: 500,
  color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 5,
  transition: "all 0.15s ease",
};

const filterTabActive = {
  background: "var(--accent)", color: "#fff", borderColor: "var(--accent)",
};

const countBadge = {
  fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 10,
  background: "var(--accent-glow)",
};

const countBadgeActive = {
  background: "rgba(255,255,255,0.2)",
};

const searchRow = { marginBottom: 20 };

const searchBox = {
  display: "flex", alignItems: "center", gap: 10,
  background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 12,
  padding: "10px 16px", maxWidth: 480,
  transition: "all 0.15s ease",
};

const searchInput = {
  border: "none", outline: "none", background: "transparent",
  flex: 1, fontSize: 14, color: "var(--text-primary)",
};

const tableCard = {
  background: "var(--bg-card)", borderRadius: 20, border: "1px solid var(--card-border)",
  boxShadow: "var(--shadow-sm)", overflowX: "auto",
  transition: "all 0.3s ease",
};

const tableStyle = { width: "100%", borderCollapse: "collapse" };

const th = {
  padding: "14px 16px", textAlign: "left", fontSize: 11, fontWeight: 600,
  textTransform: "uppercase", color: "var(--text-muted)", borderBottom: "1px solid var(--border-light)",
  whiteSpace: "nowrap", letterSpacing: "0.05em",
};

const td = {
  padding: "14px 16px", fontSize: 13, color: "var(--text-secondary)", borderBottom: "1px solid var(--border-light)",
  verticalAlign: "middle",
};

const trStyle = { cursor: "pointer", transition: "background 0.1s ease" };

const badgeStyle = {
  padding: "4px 12px", borderRadius: 20, fontSize: 11,
  fontWeight: 600, textTransform: "uppercase", whiteSpace: "nowrap",
};

const avatarCircle = {
  width: 34, height: 34, borderRadius: "50%",
  display: "flex", alignItems: "center", justifyContent: "center",
  transition: "all 0.15s ease",
};

const expandBtn = {
  background: "none", border: "none", cursor: "pointer",
  color: "var(--text-muted)", fontSize: 18, padding: 4,
};

const editBtn = {
  background: "var(--info)", border: "none", cursor: "pointer", padding: 6,
  borderRadius: 6, color: "#fff", transition: "all 0.15s ease",
};

const deleteBtn = {
  background: "var(--error)", border: "none", cursor: "pointer", padding: 6,
  borderRadius: 6, color: "#fff", transition: "all 0.15s ease",
};

const detailWrap = {
  background: "var(--bg-card-hover)", padding: "20px 28px", borderTop: "1px solid var(--border)",
};

const detailGrid = {
  display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20,
};

const detailItemStyle = {
  padding: "12px 16px", background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)",
  transition: "all 0.15s ease",
};

const spinnerStyle = {
  width: 36, height: 36, border: "4px solid var(--border)",
  borderTopColor: "var(--accent)", borderRadius: "50%",
  animation: "userSpin 0.8s linear infinite", marginBottom: 14,
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

/* modal styles */
const modalOverlay = {
  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 1000,
};

const modalContent = {
  backgroundColor: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--card-border)",
  boxShadow: "var(--shadow-lg)", maxWidth: 500, width: "90%", maxHeight: "90vh", overflow: "auto",
};

const modalHeader = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: 24, borderBottom: "1px solid var(--border)",
};

const modalCloseBtn = {
  background: "none", border: "none", cursor: "pointer", padding: 8,
  borderRadius: 8, color: "var(--text-secondary)",
  transition: "all 0.15s ease",
};

const modalBody = {
  padding: 24,
};

const modalInput = {
  width: "100%", padding: "12px 16px", borderRadius: 8,
  border: "1px solid var(--border)", backgroundColor: "var(--bg-input)",
  color: "var(--text-primary)", fontSize: 14,
  outline: "none", transition: "all 0.15s ease",
};

const modalActions = {
  display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24,
};

const modalCancelBtn = {
  padding: "10px 20px", borderRadius: 8, border: "1px solid var(--border)",
  backgroundColor: "var(--bg-card)", color: "var(--text-secondary)",
  cursor: "pointer", fontSize: 14, fontWeight: 500,
  transition: "all 0.15s ease",
};

const modalSaveBtn = {
  padding: "10px 20px", borderRadius: 8, border: "none",
  backgroundColor: "var(--success)", color: "#fff",
  cursor: "pointer", fontSize: 14, fontWeight: 500,
  transition: "all 0.15s ease",
};

const formLabel = {
  display: "block", fontSize: 14, fontWeight: 600, color: "var(--text-primary)",
  marginBottom: 8,
};
