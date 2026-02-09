'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FileUpload from '../../components/FileUpload';
import { FileText, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface Document {
    _id: string;
    fileName: string;
    status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
    uploadedAt: string;
    documentType?: string;
    totalAmount?: number;
    currency?: string;
    vendorName?: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'PROCESSING' | 'COMPLETED' | 'FAILED'>('all');

    const fetchDocuments = async () => {
        try {
            const queryParams = filter !== 'all' ? `?status=${filter}` : '';
            const response = await fetch(`/api/documents${queryParams}`);
            const data = await response.json();

            if (data.success) {
                setDocuments(data.documents);
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [filter]);

    // Poll for updates every 5 seconds if there are processing documents
    useEffect(() => {
        const hasProcessing = documents.some(doc => doc.status === 'PROCESSING');

        if (!hasProcessing) return;

        const interval = setInterval(fetchDocuments, 5000);
        return () => clearInterval(interval);
    }, [documents]);

    const handleUploadComplete = (documentId: string) => {
        // Refresh document list
        fetchDocuments();
        // Optionally navigate to the document detail page
        // router.push(`/dashboard/${documentId}`);
    };

    const filteredDocuments = documents;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PROCESSING':
                return <Clock size={18} className="status-icon processing" />;
            case 'COMPLETED':
                return <CheckCircle size={18} className="status-icon completed" />;
            case 'FAILED':
                return <XCircle size={18} className="status-icon failed" />;
            default:
                return null;
        }
    };

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div className="header-content">
                    <h1 className="dashboard-title">Financial Document Intelligence</h1>
                    <p className="dashboard-subtitle">
                        AI-powered document processing with Mastra + Inngest
                    </p>
                </div>
            </div>

            <div className="dashboard-container">
                {/* Upload Section */}
                <section className="upload-section">
                    <FileUpload onUploadComplete={handleUploadComplete} />
                </section>

                {/* Filter Tabs */}
                <div className="filter-tabs">
                    <button
                        className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All Documents
                    </button>
                    <button
                        className={`filter-tab ${filter === 'PROCESSING' ? 'active' : ''}`}
                        onClick={() => setFilter('PROCESSING')}
                    >
                        Processing
                    </button>
                    <button
                        className={`filter-tab ${filter === 'COMPLETED' ? 'active' : ''}`}
                        onClick={() => setFilter('COMPLETED')}
                    >
                        Completed
                    </button>
                    <button
                        className={`filter-tab ${filter === 'FAILED' ? 'active' : ''}`}
                        onClick={() => setFilter('FAILED')}
                    >
                        Failed
                    </button>
                </div>

                {/* Documents Table */}
                <section className="documents-section">
                    <h2 className="section-title">Recent Documents</h2>

                    {isLoading ? (
                        <div className="loading-state">Loading documents...</div>
                    ) : filteredDocuments.length === 0 ? (
                        <div className="empty-state">
                            <FileText size={48} />
                            <h3>No documents found</h3>
                            <p>Upload a financial document to get started</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="documents-table">
                                <thead>
                                    <tr>
                                        <th>Status</th>
                                        <th>File Name</th>
                                        <th>Document Type</th>
                                        <th>Vendor</th>
                                        <th>Amount</th>
                                        <th>Uploaded</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDocuments.map((doc) => (
                                        <tr key={doc._id}>
                                            <td>
                                                <div className={`status-cell ${doc.status.toLowerCase()}`}>
                                                    {getStatusIcon(doc.status)}
                                                    <span>{doc.status}</span>
                                                </div>
                                            </td>
                                            <td className="file-name">
                                                <FileText size={16} />
                                                {doc.fileName}
                                            </td>
                                            <td>{doc.documentType || '-'}</td>
                                            <td>{doc.vendorName || '-'}</td>
                                            <td>
                                                {doc.totalAmount
                                                    ? `${doc.currency || 'USD'} ${doc.totalAmount.toFixed(2)}`
                                                    : '-'
                                                }
                                            </td>
                                            <td>{format(new Date(doc.uploadedAt), 'MMM dd, yyyy HH:mm')}</td>
                                            <td>
                                                <button
                                                    className="view-button"
                                                    onClick={() => router.push(`/dashboard/${doc._id}`)}
                                                >
                                                    <Eye size={16} />
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>

            <style jsx>{`
        .dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .dashboard-header {
          background: white;
          padding: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .header-content {
          max-width: 1400px;
          margin: 0 auto;
        }

        .dashboard-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #2d3748;
          margin: 0 0 0.5rem 0;
        }

        .dashboard-subtitle {
          font-size: 1.1rem;
          color: #718096;
          margin: 0;
        }

        .dashboard-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }

        .upload-section {
          margin-bottom: 3rem;
        }

        .filter-tabs {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .filter-tab {
          padding: 0.75rem 1.5rem;
          background: white;
          border: 2px solid transparent;
          border-radius: 8px;
          font-weight: 600;
          color: #4a5568;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-tab:hover {
          background: #f7fafc;
          border-color: #667eea;
        }

        .filter-tab.active {
          background: white;
          border-color: #667eea;
          color: #667eea;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
        }

        .documents-section {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #2d3748;
          margin: 0 0 1.5rem 0;
        }

        .loading-state,
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: #718096;
        }

        .empty-state svg {
          color: #cbd5e0;
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          color: #4a5568;
          margin-bottom: 0.5rem;
        }

        .table-container {
          overflow-x: auto;
        }

        .documents-table {
          width: 100%;
          border-collapse: collapse;
        }

        .documents-table thead {
          background: #f7fafc;
        }

        .documents-table th {
          padding: 1rem;
          text-align: left;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #4a5568;
          font-weight: 600;
        }

        .documents-table td {
          padding: 1rem;
          border-top: 1px solid #e2e8f0;
          color: #2d3748;
        }

        .documents-table tbody tr {
          transition: background 0.2s;
        }

        .documents-table tbody tr:hover {
          background: #f7fafc;
        }

        .status-cell {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .status-icon.processing {
          color: #4299e1;
        }

        .status-icon.completed {
          color: #48bb78;
        }

        .status-icon.failed {
          color: #f56565;
        }

        .file-name {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
        }

        .view-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .view-button:hover {
          background: #5568d3;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }
      `}</style>
        </div>
    );
}
