import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Workflow } from '@mastra/core/workflows';
import fs from 'fs';

// Zod Schema for Financial Document Extraction
export const LineItemSchema = z.object({
    description: z.string().describe('Description of the item or service'),
    quantity: z.number().describe('Quantity of items'),
    unitPrice: z.number().describe('Price per unit'),
    totalPrice: z.number().describe('Total price for this line item'),
});

export const FinancialDocumentSchema = z.object({
    documentType: z.string().describe('Type of document (e.g., Invoice, Receipt, Bill)'),
    invoiceNumber: z.string().optional().describe('Invoice or document number'),
    invoiceDate: z.string().optional().describe('Date of the invoice (ISO format)'),
    dueDate: z.string().optional().describe('Payment due date (ISO format)'),
    vendorName: z.string().optional().describe('Name of the vendor/seller'),
    vendorAddress: z.string().optional().describe('Address of the vendor'),
    clientName: z.string().optional().describe('Name of the client/buyer'),
    clientAddress: z.string().optional().describe('Address of the client'),
    subtotal: z.number().optional().describe('Subtotal amount before tax'),
    taxAmount: z.number().optional().describe('Tax amount'),
    totalAmount: z.number().describe('Total amount to be paid'),
    currency: z.string().default('USD').describe('Currency code (e.g., USD, EUR)'),
    lineItems: z.array(LineItemSchema).optional().describe('Individual line items'),
});

export const AudioAnalysisSchema = z.object({
    sentiment: z.enum(['Positive', 'Neutral', 'Negative']).describe('Overall sentiment of the discussion'),
    speakers: z.array(z.string()).describe('List of identified speakers (e.g., Speaker 1, Speaker 2, or names if available)'),
    topics: z.array(z.string()).describe('Key financial topics discussed'),
    transcript: z.string().optional().describe('Full text transcript of the audio'),
});

export type FinancialDocumentData = z.infer<typeof FinancialDocumentSchema>;
export type AudioAnalysisData = z.infer<typeof AudioAnalysisSchema>;

// Create a workflow for document processing (Keeping Workflow structure for compatibility if needed elsewhere)
export const documentProcessingWorkflow = new Workflow({
    id: 'process-financial-document',
    inputSchema: z.object({
        documentId: z.string(),
        fileContent: z.string(),
    }),
    outputSchema: z.any(),
});

// Helper function to process document with Gemini
export async function extractFinancialData(
    fileContent: string
): Promise<FinancialDocumentData> {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('GEMINI_API_KEY is missing');

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
            You are an expert financial document analyzer. Extract structured data from this document content.
            
            Extract the following:
            - Document type and number
            - Vendor and client information
            - Dates (invoice date, due date)
            - Financial amounts (subtotal, tax, total)
            - Line items with descriptions, quantities, and prices
            - Currency

            Return ONLY valid JSON matching this schema:
            {
                "documentType": "string",
                "invoiceNumber": "string (optional)",
                "invoiceDate": "ISO date string (optional)",
                "dueDate": "ISO date string (optional)",
                "vendorName": "string (optional)",
                "vendorAddress": "string (optional)",
                "clientName": "string (optional)",
                "clientAddress": "string (optional)",
                "subtotal": number (optional),
                "taxAmount": number (optional),
                "totalAmount": number,
                "currency": "string",
                "lineItems": [{ "description": "string", "quantity": number, "unitPrice": number, "totalPrice": number }]
            }

            Document Content:
            ${fileContent}
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const jsonString = responseText.replace(/```json\n|\n```/g, '').replace(/```/g, '').trim();

        const data = JSON.parse(jsonString);

        return data as FinancialDocumentData;

    } catch (error: any) {
        console.error('Error extracting financial data with Gemini:', error);
        throw new Error(`Failed to extract financial data from document: ${error.message}`);
    }
}

// Helper function to analyze audio with Gemini
export async function analyzeAudio(filePath: string, fileType: string): Promise<AudioAnalysisData> {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is missing');
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Read file as base64
        const fileBuffer = fs.readFileSync(filePath);
        const base64Data = fileBuffer.toString('base64');

        const prompt = `
            Analyze this audio file. 
            Identify the speakers (e.g., Speaker 1, Speaker 2).
            Determine the overall sentiment (Positive, Neutral, Negative).
            List the key financial topics discussed.
            Provide a transcript if possible.

            Return the response in valid JSON format matching this schema:
            {
                "sentiment": "Positive" | "Neutral" | "Negative",
                "speakers": ["Speaker 1", ...],
                "topics": ["Topic 1", ...],
                "transcript": "Full text transcript..."
            }
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: fileType,
                    data: base64Data
                }
            }
        ]);

        const responseText = result.response.text();
        const jsonString = responseText.replace(/```json\n|\n```/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(jsonString);

        return {
            sentiment: data.sentiment,
            speakers: data.speakers,
            topics: data.topics,
            transcript: data.transcript
        };

    } catch (error: any) {
        console.error('Error analyzing audio with Gemini:', error);
        throw new Error(`Failed to analyze audio with Gemini: ${error.message}`);
    }
}
