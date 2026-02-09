import { inngest } from './client';
import { connectToDatabase } from '../mongoose';
import FinancialDocument from '../../models/FinancialDocument';
import { extractFinancialData, analyzeAudio } from '../mastra';
import fs from 'fs';

// Background function to process financial documents (PDF/Images)
export const processFinancialDocument = inngest.createFunction(
    {
        id: 'process-financial-document',
        name: 'Process Financial Document with AI',
        throttle: {
            limit: 5,
            period: '1m',
        },
    },
    { event: 'app/document.uploaded' },
    async ({ event, step }) => {
        const { documentId, filePath } = event.data;

        // Step 1: Read the file content
        const fileContent = await step.run('read-file', async () => {
            try {
                if (!fs.existsSync(filePath)) {
                    throw new Error(`File not found at path: ${filePath}`);
                }
                return await fs.promises.readFile(filePath, 'utf-8');
            } catch (error: any) {
                console.error('Error reading file:', error);
                throw new Error(`Failed to read uploaded file: ${error.message}`);
            }
        });

        // Step 2: Extract data using AI (Mastra)
        const extractedData = await step.run('extract-data-with-ai', async () => {
            try {
                return await extractFinancialData(fileContent);
            } catch (error: any) {
                console.error('Error extracting data:', error);
                throw new Error(`AI Extraction Failed: ${error.message}`);
            }
        });

        // Step 3: Update database with extracted data
        await step.run('update-database', async () => {
            await connectToDatabase();

            try {
                const updateResult = await FinancialDocument.findByIdAndUpdate(documentId, {
                    status: 'COMPLETED',
                    documentType: extractedData.documentType,
                    invoiceNumber: extractedData.invoiceNumber,
                    invoiceDate: extractedData.invoiceDate
                        ? new Date(extractedData.invoiceDate)
                        : undefined,
                    dueDate: extractedData.dueDate
                        ? new Date(extractedData.dueDate)
                        : undefined,
                    vendorName: extractedData.vendorName,
                    vendorAddress: extractedData.vendorAddress,
                    clientName: extractedData.clientName,
                    clientAddress: extractedData.clientAddress,
                    subtotal: extractedData.subtotal,
                    taxAmount: extractedData.taxAmount,
                    totalAmount: extractedData.totalAmount,
                    currency: extractedData.currency,
                    lineItems: extractedData.lineItems,
                    processedAt: new Date(),
                });

                if (!updateResult) {
                    throw new Error(`Document with ID ${documentId} not found`);
                }

                return { success: true };
            } catch (error: any) {
                console.error('Error updating database:', error);

                // Mark document as failed
                await FinancialDocument.findByIdAndUpdate(documentId, {
                    status: 'FAILED',
                    processingError: error instanceof Error ? error.message : 'Unknown error',
                    processedAt: new Date(),
                });

                throw error;
            }
        });

        return { documentId, status: 'completed' };
    }
);

// Background function for audio processing (Challenge 1)
export const processFinancialAudio = inngest.createFunction(
    {
        id: 'process-financial-audio',
        name: 'Process Financial Audio with AI',
        throttle: {
            limit: 2,
            period: '1m',
        },
    },
    { event: 'app/audio.uploaded' },
    async ({ event, step }) => {
        const { documentId, filePath } = event.data;

        // Step 1: Analyze audio with Gemini (Transcription + Analysis in one go)
        const analysisData = await step.run('analyze-audio-gemini', async () => {
            try {
                if (!fs.existsSync(filePath)) {
                    throw new Error(`Audio file not found at path: ${filePath}`);
                }

                // Pass file path and mime type (assuming mp3 for now, or detect)
                const fileType = filePath.endsWith('.wav') ? 'audio/wav' : 'audio/mp3';
                return await analyzeAudio(filePath, fileType);
            } catch (error: any) {
                console.error('Audio Analysis error:', error);
                throw new Error(`Failed to analyze audio with Gemini: ${error.message}`);
            }
        });

        // Step 2: Update database
        await step.run('update-database', async () => {
            await connectToDatabase();

            try {
                const updateResult = await FinancialDocument.findByIdAndUpdate(documentId, {
                    status: 'COMPLETED',
                    // Store audio-specific data
                    transcript: (analysisData as any).transcript || "Transcript not available",
                    sentiment: analysisData.sentiment,
                    speakers: analysisData.speakers,
                    topics: analysisData.topics,
                    processedAt: new Date(),
                });

                if (!updateResult) {
                    throw new Error(`Document with ID ${documentId} not found`);
                }
            } catch (error: any) {
                console.error('Error updating database (Audio):', error);

                // Mark document as failed
                await FinancialDocument.findByIdAndUpdate(documentId, {
                    status: 'FAILED',
                    processingError: error instanceof Error ? error.message : 'Unknown error',
                    processedAt: new Date(),
                });
                throw error;
            }
        });

        return { documentId, status: 'completed' };
    }
);
