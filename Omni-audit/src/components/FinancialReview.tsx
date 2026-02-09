'use client';

import { useState, useEffect } from 'react';
import { FileText, Calendar, DollarSign, Building2, User, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface LineItem {
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

interface DocumentData {
    _id: string;
    fileName: string;
    fileUrl?: string;
    status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
    documentType?: string;
    invoiceNumber?: string;
    invoiceDate?: string;
    dueDate?: string;
    vendorName?: string;
    vendorAddress?: string;
    clientName?: string;
    clientAddress?: string;
    subtotal?: number;
    taxAmount?: number;
    totalAmount?: number;
    currency?: string;
    lineItems?: LineItem[];
    uploadedAt: string;
    processedAt?: string;
    processingError?: string;
}

interface FinancialReviewProps {
    pdfUrl?: string;
    initialData: DocumentData;
}

export default function FinancialReview({ pdfUrl, initialData }: FinancialReviewProps) {
    const [data, setData] = useState<DocumentData>(initialData);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Poll for updates if status is PROCESSING
    useEffect(() => {
        if (data.status !== 'PROCESSING') return;

        const interval = setInterval(async () => {
            setIsRefreshing(true);
            try {
                const response = await fetch(`/api/documents?_id=${data._id}`);
                const result = await response.json();
                if (result.documents && result.documents[0]) {
                    setData(result.documents[0]);
                }
            } catch (error) {
                console.error('Error refreshing document:', error);
            } finally {
                setIsRefreshing(false);
            }
        }, 3000); // Poll every 3 seconds

        return () => clearInterval(interval);
    }, [data.status, data._id]);

    return (
        <div className="financial-review">
            <div className="review-header">
                <div className="header-content">
                    <h1 className="document-title">
                        <FileText size={28} />
                        {data.fileName}
                    </h1>
                    <div className={`status-badge ${data.status.toLowerCase()}`}>
                        {data.status === 'PROCESSING' && <Loader2 className="spinning" size={16} />}
                        {data.status}
                    </div>
                </div>
            </div>

            <div className="review-container">
                {/* PDF Viewer Section */}
                {pdfUrl && (
                    <div className="pdf-section">
                        <iframe
                            src={pdfUrl}
                            className="pdf-viewer"
                            title="Document Preview"
                        />
                    </div>
                )}

                {/* Extracted Data Section */}
                <div className="data-section">
                    {data.status === 'PROCESSING' ? (
                        <div className="processing-state">
                            <Loader2 className="spinning" size={48} />
                            <h3>Processing Document...</h3>
                            <p>Our AI is extracting data from your document</p>
                        </div>
                    ) : data.status === 'FAILED' ? (
                        <div className="error-state">
                            <h3>Processing Failed</h3>
                            <p>{data.processingError || 'An error occurred while processing the document'}</p>
                        </div>
                    ) : (
                        <>
                            {/* Document Info */}
                            <section className="info-card">
                                <h2 className="section-title">Document Information</h2>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <FileText size={18} />
                                        <div>
                                            <label>Document Type</label>
                                            <p>{data.documentType || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="info-item">
                                        <label>Invoice Number</label>
                                        <p>{data.invoiceNumber || 'N/A'}</p>
                                    </div>
                                    <div className="info-item">
                                        <Calendar size={18} />
                                        <div>
                                            <label>Invoice Date</label>
                                            <p>
                                                {data.invoiceDate
                                                    ? format(new Date(data.invoiceDate), 'MMM dd, yyyy')
                                                    : 'N/A'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <div className="info-item">
                                        <Calendar size={18} />
                                        <div>
                                            <label>Due Date</label>
                                            <p>
                                                {data.dueDate
                                                    ? format(new Date(data.dueDate), 'MMM dd, yyyy')
                                                    : 'N/A'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Parties */}
                            <section className="info-card">
                                <h2 className="section-title">Parties</h2>
                                <div className="parties-grid">
                                    <div className="party-info">
                                        <div className="party-header">
                                            <Building2 size={20} />
                                            <h3>Vendor</h3>
                                        </div>
                                        <p className="party-name">{data.vendorName || 'N/A'}</p>
                                        <p className="party-address">{data.vendorAddress || 'N/A'}</p>
                                    </div>
                                    <div className="party-info">
                                        <div className="party-header">
                                            <User size={20} />
                                            <h3>Client</h3>
                                        </div>
                                        <p className="party-name">{data.clientName || 'N/A'}</p>
                                        <p className="party-address">{data.clientAddress || 'N/A'}</p>
                                    </div>
                                </div>
                            </section>

                            {/* Line Items */}
                            {data.lineItems && data.lineItems.length > 0 && (
                                <section className="info-card">
                                    <h2 className="section-title">Line Items</h2>
                                    <div className="table-container">
                                        <table className="line-items-table">
                                            <thead>
                                                <tr>
                                                    <th>Description</th>
                                                    <th>Quantity</th>
                                                    <th>Unit Price</th>
                                                    <th>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.lineItems.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>{item.description}</td>
                                                        <td>{item.quantity}</td>
                                                        <td>{data.currency} {item.unitPrice.toFixed(2)}</td>
                                                        <td>{data.currency} {item.totalPrice.toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            )}

                            {/* Financial Summary */}
                            <section className="info-card financial-summary">
                                <h2 className="section-title">
                                    <DollarSign size={20} />
                                    Financial Summary
                                </h2>
                                <div className="summary-items">
                                    <div className="summary-row">
                                        <span>Subtotal</span>
                                        <span className="amount">
                                            {data.currency} {data.subtotal?.toFixed(2) || '0.00'}
                                        </span>
                                    </div>
                                    <div className="summary-row">
                                        <span>Tax</span>
                                        <span className="amount">
                                            {data.currency} {data.taxAmount?.toFixed(2) || '0.00'}
                                        </span>
                                    </div>
                                    <div className="summary-row total">
                                        <span>Total Amount</span>
                                        <span className="amount">
                                            {data.currency} {data.totalAmount?.toFixed(2) || '0.00'}
                                        </span>
                                    </div>
                                </div>
                            </section>
                        </>
                    )}
                </div>
            </div>

            <style jsx>{`
        .financial-review {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
        }

        .review-header {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .document-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 0;
          font-size: 1.75rem;
          color: #2d3748;
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.875rem;
          text-transform: uppercase;
        }

        .status-badge.processing {
          background: #bee3f8;
          color: #2c5282;
        }

        .status-badge.completed {
          background: #c6f6d5;
          color: #22543d;
        }

        .status-badge.failed {
          background: #fed7d7;
          color: #742a2a;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .review-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        @media (max-width: 1024px) {
          .review-container {
            grid-template-columns: 1fr;
          }
        }

        .pdf-section {
          background: white;
          border-radius: 12px;
          padding: 1rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          height: fit-content;
          position: sticky;
          top: 2rem;
        }

        .pdf-viewer {
          width: 100%;
          height: 800px;
          border: none;
          border-radius: 8px;
        }

        .data-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .processing-state,
        .error-state {
          background: white;
          border-radius: 12px;
          padding: 4rem 2rem;
          text-align: center;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .processing-state svg {
          color: #4299e1;
          margin-bottom: 1rem;
        }

        .error-state h3 {
          color: #e53e3e;
          margin-bottom: 0.5rem;
        }

        .info-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.25rem;
          color: #2d3748;
          margin: 0 0 1.5rem 0;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid #e2e8f0;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        .info-item {
          display: flex;
          align-items: start;
          gap: 0.75rem;
        }

        .info-item label {
          display: block;
          font-size: 0.75rem;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
        }

        .info-item p {
          margin: 0;
          font-size: 1rem;
          color: #2d3748;
          font-weight: 500;
        }

        .parties-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
        }

        .party-info {
          padding: 1rem;
          background: #f7fafc;
          border-radius: 8px;
        }

        .party-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          color: #4a5568;
        }

        .party-header h3 {
          margin: 0;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .party-name {
          font-weight: 600;
          color: #2d3748;
          margin: 0 0 0.5rem 0;
        }

        .party-address {
          font-size: 0.875rem;
          color: #718096;
          margin: 0;
        }

        .table-container {
          overflow-x: auto;
        }

        .line-items-table {
          width: 100%;
          border-collapse: collapse;
        }

        .line-items-table thead {
          background: #f7fafc;
        }

        .line-items-table th {
          padding: 0.75rem;
          text-align: left;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #4a5568;
          font-weight: 600;
        }

        .line-items-table td {
          padding: 0.75rem;
          border-top: 1px solid #e2e8f0;
          color: #2d3748;
        }

        .line-items-table tbody tr:hover {
          background: #f7fafc;
        }

        .summary-items {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid #e2e8f0;
        }

        .summary-row.total {
          border-bottom: none;
          border-top: 2px solid #2d3748;
          padding-top: 1rem;
          margin-top: 0.5rem;
          font-weight: 700;
          font-size: 1.25rem;
          color: #2d3748;
        }

        .summary-row .amount {
          font-weight: 600;
          color: #4a5568;
        }

        .summary-row.total .amount {
          color: #2d3748;
        }
      `}</style>
        </div>
    );
}
