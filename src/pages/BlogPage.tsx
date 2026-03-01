import { useState, useEffect } from "react";
import { Search, Filter, Download, User, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "motion/react";

interface Submission {
  timestamp: string;
  name: string;
  email: string;
  subject: string;
  pdfLink: string;
  status: string;
  id: string;
}

export default function BlogPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");

  useEffect(() => {
    fetch("/api/submissions")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSubmissions(data);
        } else {
          console.error("Expected array from API, got:", data);
          setSubmissions([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredSubmissions = submissions.filter((s) => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.timestamp.includes(searchTerm);
    
    // Simple filter logic - could be expanded
    return matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 tracking-tight">Research Submissions</h1>
        <p className="text-stone-500 text-lg max-w-2xl mx-auto">
          Explore the latest research papers and academic contributions from our global community.
        </p>
      </header>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by name, subject, or date..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-900 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-3 bg-white border border-stone-200 rounded-2xl hover:bg-stone-50 transition-colors">
            <Filter size={18} />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredSubmissions.map((submission) => (
              <motion.div 
                key={submission.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-stone-200 rounded-3xl p-6 hover:shadow-xl hover:shadow-stone-200/50 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-stone-100 text-stone-600 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider">
                    {submission.status}
                  </div>
                  <time className="text-stone-400 text-sm font-mono">
                    {submission.timestamp.split(' ')[0]}
                  </time>
                </div>

                <h3 className="text-xl font-bold mb-3 group-hover:text-stone-700 transition-colors leading-tight">
                  {submission.subject}
                </h3>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-stone-500 text-sm">
                    <User size={14} />
                    <span>{submission.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-500 text-sm">
                    <Calendar size={14} />
                    <span>Submitted on {submission.timestamp}</span>
                  </div>
                </div>

                <a 
                  href={submission.pdfLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 w-full justify-center py-3 bg-stone-900 text-white rounded-2xl hover:bg-stone-800 transition-colors font-medium"
                >
                  <Download size={18} />
                  Download PDF
                </a>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {!loading && filteredSubmissions.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-stone-300">
          <FileText className="mx-auto text-stone-300 mb-4" size={48} />
          <p className="text-stone-500">No submissions found matching your search.</p>
        </div>
      )}
    </div>
  );
}
