import React, { useRef, useEffect, useState } from 'react';

const SignaturePad = ({ onSignatureChange }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [context, setContext] = useState(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000000';
        setContext(ctx);
    }, []);

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        context.beginPath();
        context.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        context.lineTo(x, y);
        context.stroke();
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        
        context.closePath();
        setIsDrawing(false);
        updateSignature();
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        context.clearRect(0, 0, canvas.width, canvas.height);
        onSignatureChange('');
    };

    const updateSignature = () => {
        const canvas = canvasRef.current;
        const signatureData = canvas.toDataURL('image/png');
        onSignatureChange(signatureData);
    };

    return (
        <div className="signature-pad">
            <canvas
                ref={canvasRef}
                width={400}
                height={200}
                style={{ border: '1px solid #ccc', background: '#fff' }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={(e) => {
                    e.preventDefault();
                    startDrawing(e.touches[0]);
                }}
                onTouchMove={(e) => {
                    e.preventDefault();
                    draw(e.touches[0]);
                }}
                onTouchEnd={stopDrawing}
            />
            <div className="mt-2">
                <button
                    type="button"
                    onClick={clearSignature}
                    className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
                >
                    Clear Signature
                </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
                Sign in the box above
            </p>
        </div>
    );
};

export default SignaturePad;