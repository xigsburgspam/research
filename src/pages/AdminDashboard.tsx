import { useState, useEffect } from "react";
import { 
  Edit2, Trash2, AlertTriangle, CheckCircle, 
  XCircle, Save, X, ExternalLink, Mail, Search
} from "lucide-react";

interface Submission {
  timestamp: string;
  name: string;
  email: string;
  subject: string;
  pdfLink: string;
  status: "Active" | "Warning" | "Removed";
  adminNotes: string;
  id: string;
}

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Submission>>({});
  const [searchTerm, setSearchTerm] = useState("");

  const fetchSubmissions = async () => {
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch("/api/submissions/admin", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setSubmissions(data);
      } else {
        console.error("Admin fetch failed or returned non-array:", data);
        setSubmissions([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleUpdate = async (id: string, updates: Partial<Submission>) => {
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        fetchSubmissions();
        setEditingId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this submission?")) return;
    
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchSubmissions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startEditing = (s: Submission) => {
    setEditingId(s.id);
    setEditForm(s);
  };

  const filteredSubmissions = submissions.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-stone-500">Manage research submissions and member status.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input 
            type="text" 
            placeholder="Search all fields..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="px-6 py-4 text-sm font-semibold text-stone-600">Member</th>
                  <th className="px-6 py-4 text-sm font-semibold text-stone-600">Subject</th>
                  <th className="px-6 py-4 text-sm font-semibold text-stone-600">Status</th>
                  <th className="px-6 py-4 text-sm font-semibold text-stone-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredSubmissions.map((s) => (
                  <tr key={s.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-stone-900">{s.name}</div>
                      <div className="text-xs text-stone-400 flex items-center gap-1">
                        <Mail size={10} />
                        {s.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-stone-700 font-medium line-clamp-1">{s.subject}</div>
                      <a 
                        href={s.pdfLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                      >
                        View PDF <ExternalLink size={10} />
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      {editingId === s.id ? (
                        <select 
                          className="text-sm border border-stone-200 rounded-lg px-2 py-1 bg-white"
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                        >
                          <option value="Active">Active</option>
                          <option value="Warning">Warning</option>
                          <option value="Removed">Removed</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          s.status === 'Active' ? 'bg-green-100 text-green-700' :
                          s.status === 'Warning' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {s.status === 'Active' && <CheckCircle size={10} />}
                          {s.status === 'Warning' && <AlertTriangle size={10} />}
                          {s.status === 'Removed' && <XCircle size={10} />}
                          {s.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {editingId === s.id ? (
                          <>
                            <button 
                              onClick={() => handleUpdate(s.id, editForm)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Save Changes"
                            >
                              <Save size={18} />
                            </button>
                            <button 
                              onClick={() => setEditingId(null)}
                              className="p-2 text-stone-400 hover:bg-stone-100 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <X size={18} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => startEditing(s)}
                              className="p-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(s.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredSubmissions.length === 0 && (
            <div className="p-12 text-center text-stone-400">
              No submissions found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
