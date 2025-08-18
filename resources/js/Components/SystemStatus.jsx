import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle, LoaderCircle } from 'lucide-react';

export default function SystemStatus() {
    const [status, setStatus] = useState('loading');
    const [latency, setLatency] = useState(0);

    useEffect(() => {
        // Function to fetch the system status
        const fetchStatus = async () => {
            const startTime = Date.now();
            try {
                // Use a cache-busting parameter to ensure a fresh request every time
                await axios.get(`/up?t=${new Date().getTime()}`);
                
                // If successful, update the status to 'online'
                setStatus('online');
                const endTime = Date.now();
                setLatency(endTime - startTime);

            } catch (error) {
                // If there's an error, update the status to 'offline'
                console.error("System status check failed:", error);
                setStatus('offline');
            }
        };

        // --- Real-time Refresh Logic ---
        
        // 1. Run the check immediately when the component first loads
        fetchStatus();

        // 2. Set an interval to run the check every 5 seconds (5000 milliseconds)
        const intervalId = setInterval(fetchStatus, 5000);

        // 3. Cleanup function: This is important! It stops the interval
        //    when the component is removed from the screen to prevent memory leaks.
        return () => clearInterval(intervalId);

    }, []); // The empty array ensures this setup runs only once.

    // --- Render UI based on the current status ---

    if (status === 'loading') {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 p-2 rounded-lg bg-gray-100 dark:bg-gray-700/50">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                <span>Checking status...</span>
            </div>
        );
    }

    if (status === 'offline') {
        return (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 p-2 rounded-lg bg-red-50 dark:bg-red-900/40">
                <XCircle className="h-4 w-4" />
                <span>System Offline</span>
            </div>
        );
    }
    
    // Default: Online status
    return (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 p-2 rounded-lg bg-green-50 dark:bg-green-900/40">
            <CheckCircle className="h-4 w-4" />
            <div>
                <p className="font-semibold">Application up</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Response received in {latency}ms.</p>
            </div>
        </div>
    );
}