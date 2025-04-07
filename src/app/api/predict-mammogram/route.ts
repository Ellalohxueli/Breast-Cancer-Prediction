import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { connectToMongoDB } from "@/dbConfig/dbConfig";
import PatientReport from '@/models/PatientReport';

export async function POST(request: Request) {
    try {
        const { image, patientId } = await request.json();

        if (!image) {
            return NextResponse.json(
                { error: 'No image provided' },
                { status: 400 }
            );
        }

        if (!patientId) {
            return NextResponse.json(
                { error: 'No patient ID provided' },
                { status: 400 }
            );
        }

        console.log('Starting prediction process...');

        // Create a promise to handle the Python process
        const result = await new Promise((resolve, reject) => {
            const pythonProcess = spawn('python', [
                path.join(process.cwd(), 'scripts', 'predict.py')
            ]);

            let output = '';
            let error = '';
            let jsonOutput = '';
            let isCollectingJson = false;

            // Send data to Python process
            pythonProcess.stdin.write(JSON.stringify({ image }));
            pythonProcess.stdin.end();

            // Collect output
            pythonProcess.stdout.on('data', (data) => {
                const lines = data.toString().split('\n');
                for (const line of lines) {
                    if (line.trim() === 'RESULT_JSON_START') {
                        isCollectingJson = true;
                        jsonOutput = '';
                    } else if (line.trim() === 'RESULT_JSON_END') {
                        isCollectingJson = false;
                    } else if (isCollectingJson) {
                        jsonOutput += line;
                    } else {
                        output += line + '\n';
                    }
                }
            });

            // Log progress messages from Python
            pythonProcess.stderr.on('data', (data) => {
                const message = data.toString();
                console.log('Python process:', message);
                error += message;
            });

            pythonProcess.on('close', async (code) => {
                console.log('Python process finished with code:', code);
                if (code !== 0) {
                    console.error('Python process error:', error);
                    reject(new Error(`Python process exited with code ${code}: ${error}`));
                    return;
                }

                try {
                    if (!jsonOutput.trim()) {
                        throw new Error('No JSON output received from Python script');
                    }
                    const parsedResult = JSON.parse(jsonOutput.trim());
                    console.log('Prediction completed successfully:', parsedResult);

                    // Just return the prediction result without saving to database
                    resolve(parsedResult);
                } catch (e) {
                    console.error('Failed to parse Python output. JSON attempted to parse:', jsonOutput);
                    console.error('Full output:', output);
                    reject(new Error('Failed to parse Python output'));
                }
            });
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error('Prediction error:', error);
        return NextResponse.json(
            { error: 'Failed to process image' },
            { status: 500 }
        );
    }
} 