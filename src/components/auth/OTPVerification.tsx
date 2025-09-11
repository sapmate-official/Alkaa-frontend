import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Mail, Shield, Timer, RotateCcw } from 'lucide-react';

interface OTPVerificationProps {
    organizationName: string;
    otpExpiresIn: number; // in seconds
    onVerify: (otpCode: string) => void;
    onBack: () => void;
    onResend?: () => void;
    isLoading?: boolean;
    error?: string;
}

export const OTPVerification: React.FC<OTPVerificationProps> = ({
    organizationName,
    otpExpiresIn,
    onVerify,
    onBack,
    onResend,
    isLoading = false,
    error
}) => {
    const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
    const [timeLeft, setTimeLeft] = useState(otpExpiresIn);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleChange = (element: HTMLInputElement, index: number) => {
        if (isNaN(Number(element.value))) return false;

        const newOtp = [...otp.map((d, idx) => (idx === index ? element.value : d))];
        setOtp(newOtp);

        // Focus next input
        if (element.value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto submit when all fields are filled
        if (newOtp.every(val => val !== '') && newOtp.join('').length === 6) {
            onVerify(newOtp.join(''));
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text').replace(/\D/g, ''); // Remove non-digits
        
        if (pasteData.length > 0) {
            const newOtp = [...otp];
            const remainingSlots = 6 - index;
            const digitsToFill = Math.min(pasteData.length, remainingSlots);
            
            for (let i = 0; i < digitsToFill; i++) {
                newOtp[index + i] = pasteData[i];
            }
            
            setOtp(newOtp);
            
            // Focus the next empty input or the last filled input
            const nextFocusIndex = Math.min(index + digitsToFill, 5);
            inputRefs.current[nextFocusIndex]?.focus();
            
            // Auto submit if all fields are filled
            if (newOtp.every(val => val !== '') && newOtp.join('').length === 6) {
                onVerify(newOtp.join(''));
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const otpCode = otp.join('');
        if (otpCode.length === 6) {
            onVerify(otpCode);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleResend = () => {
        if (onResend) {
            setOtp(new Array(6).fill(''));
            setTimeLeft(otpExpiresIn);
            onResend();
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <Card>
                <CardHeader className="text-center space-y-4">
                    <div className="flex items-center justify-between">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={onBack}
                            className="h-8 w-8"
                            disabled={isLoading}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex-1" />
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="p-3 bg-blue-100 rounded-full mb-4">
                            <Shield className="h-8 w-8 text-blue-600" />
                        </div>
                        <CardTitle className="text-xl">Verify OTP</CardTitle>
                        <p className="text-sm text-muted-foreground mt-2">
                            We've sent a 6-digit code to your email
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                            <Mail className="h-4 w-4" />
                            <span className="font-medium">{organizationName}</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex justify-center gap-2">
                            {otp.map((data, index) => (
                                <Input
                                    key={index}
                                    ref={(el) => inputRefs.current[index] = el}
                                    type="text"
                                    maxLength={1}
                                    value={data}
                                    onChange={(e) => handleChange(e.target, index)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    onPaste={(e) => handlePaste(e, index)}
                                    className="w-12 h-12 text-center text-lg font-semibold"
                                    disabled={isLoading}
                                    autoComplete="off"
                                />
                            ))}
                        </div>

                        {error && (
                            <div className="text-center text-sm text-red-500 bg-red-50 p-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-3">
                                <Timer className="h-4 w-4" />
                                <span>
                                    Code expires in: <span className="font-mono font-medium">{formatTime(timeLeft)}</span>
                                </span>
                            </div>
                            
                            {timeLeft > 0 ? (
                                <Button
                                    type="submit"
                                    disabled={otp.join('').length !== 6 || isLoading}
                                    className="w-full"
                                >
                                    {isLoading ? "Verifying..." : "Verify & Login"}
                                </Button>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-sm text-red-500">Code has expired</p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleResend}
                                        disabled={isLoading}
                                        className="w-full"
                                    >
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                        {isLoading ? "Resending..." : "Resend Code"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </form>
                    
                    <div className="text-center">
                        <p className="text-xs text-muted-foreground">
                            Didn't receive the code?{' '}
                            {timeLeft > 0 && onResend && (
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={isLoading}
                                    className="text-primary hover:underline"
                                >
                                    Resend
                                </button>
                            )}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
