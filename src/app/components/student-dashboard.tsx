
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, QrCode, ArrowLeft, VideoOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addAttendanceRecord } from "@/app/lib/data";
import { useAuth } from "@/contexts/AuthContext";
import jsQR from "jsqr";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function StudentDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isAttendanceMarked, setIsAttendanceMarked] = useState(false);
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isAttendanceMarked) {
      const timer = setTimeout(() => {
        setIsAttendanceMarked(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isAttendanceMarked]);

  useEffect(() => {
    if (isScanning && hasCameraPermission) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;
      
      const context = canvas.getContext("2d");
      if (!context) return;

      const tick = async () => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code) {
            await handleQrCodeData(code.data);
            return; // Stop scanning
          }
        }
        if (isScanning) {
          requestAnimationFrame(tick);
        }
      };

      const animationFrameId = requestAnimationFrame(tick);
      
      return () => {
          cancelAnimationFrame(animationFrameId);
      }
    }
  }, [isScanning, hasCameraPermission]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if(videoRef.current) {
        videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }

  const startScan = async () => {
    setIsAttendanceMarked(false);
    setIsScanning(true);
    setHasCameraPermission(null);

    // Check if we're on HTTPS or localhost
    const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';
    
    if (!isSecure) {
      setHasCameraPermission(false);
      setIsScanning(false);
      toast({
        variant: "destructive",
        title: "HTTPS Required",
        description: "Camera access requires HTTPS. Please use HTTPS or access via laptop on localhost.",
      });
      return;
    }

    try {
      // Try different camera configurations for better mobile support
      const constraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setHasCameraPermission(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Ensure video plays on mobile
        videoRef.current.play().catch(console.error);
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setHasCameraPermission(false);
      setIsScanning(false);
      
      let errorMessage = "Please enable camera permissions in your browser settings.";
      
      if (err.name === 'NotAllowedError') {
        errorMessage = "Camera permission denied. Please allow camera access and try again.";
      } else if (err.name === 'NotFoundError') {
        errorMessage = "No camera found on this device.";
      } else if (err.name === 'NotSupportedError') {
        errorMessage = "Camera not supported on this browser. Try Chrome or Safari.";
      }
      
      toast({
        variant: "destructive",
        title: "Camera Access Error",
        description: errorMessage,
      });
    }
  };

  const handleQrCodeData = async (qrCodeDataString: string | null) => {
    stopCamera();
    
    if (qrCodeDataString && qrCodeDataString.trim()) {
      try {
        const qrCodeData = JSON.parse(qrCodeDataString);
        
        if (qrCodeData.sessionId) {
          
          if (lastSessionId === qrCodeData.sessionId) {
            toast({
              variant: "default",
              title: "Already Marked",
              description: "You have already marked your attendance for this session.",
            });
            return;
          }

          // Save to MongoDB
          const response = await fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: qrCodeData.sessionId,
              studentId: user?.email?.split('@')[0], // Extract enrollment number from email
              studentName: user?.name,
              studentEmail: user?.email,
              courseCode: qrCodeData.courseCode,
              classId: qrCodeData.classId,
              date: qrCodeData.date
            })
          });

          if (!response.ok) {
            const error = await response.json();
            if (error.error === 'Attendance already marked for today') {
              toast({
                variant: "default",
                title: "Already Marked",
                description: "You have already marked your attendance for today's class.",
              });
              return;
            }
            throw new Error(error.error);
          }

          setIsAttendanceMarked(true);
          setLastSessionId(qrCodeData.sessionId);
          toast({
            title: "Success!",
            description: `Attendance marked. Welcome, ${user?.name}!`,
          });
        } else {
          throw new Error("Invalid QR Code: Missing session ID.");
        }
      } catch (error: any) {
        console.error("Error processing QR code: ", error);
        toast({
          variant: "destructive",
          title: "Scan Error",
          description: "Invalid QR Code format. Please scan the correct code.",
        });
      }
    } else {
        toast({
            variant: "destructive",
            title: "Scan Failed",
            description: "Could not detect a QR code. Please try again.",
        });
    }
  };

  return (
    <div className="mt-4 flex justify-center">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="items-center text-center">
          <CardTitle className="text-2xl">Mark Your Attendance</CardTitle>
          <CardDescription>
            {isScanning
              ? "Position the QR code from the teacher's screen inside the frame."
              : "Click the button to open your camera and scan the QR code."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex min-h-[20rem] flex-col items-center justify-center gap-4 p-4">
          {!isScanning && !isAttendanceMarked && (
            <>
              <Button size="lg" className="h-24 w-64 text-lg" onClick={startScan}>
                <QrCode className="mr-4 h-10 w-10" />
                Scan QR Code
              </Button>
              <p className="text-sm text-muted-foreground">You are signed in as: <strong>{user?.name}</strong></p>
            </>
          )}

          {isScanning && (
            <div className="w-full space-y-4">
              <div className="relative mx-auto w-full max-w-sm aspect-square rounded-md overflow-hidden border-4 border-primary/50 shadow-inner bg-background">
                <video ref={videoRef} className="h-full w-full object-cover" autoPlay playsInline muted />
                <div className="absolute inset-0 z-10" style={{
                    backgroundImage: `
                        radial-gradient(transparent, transparent),
                        linear-gradient(to right, transparent 0%, transparent 25%, white 25.5%, transparent 26%, transparent 74%, white 74.5%, transparent 75%, transparent 100%),
                        linear-gradient(to bottom, transparent 0%, transparent 25%, white 25.5%, transparent 26%, transparent 74%, white 74.5%, transparent 75%, transparent 100%)
                    `,
                    backgroundSize: '100% 100%, 100% 10px, 10px 100%',
                    backgroundRepeat: 'no-repeat, repeat-y, repeat-x',
                }}/>
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {hasCameraPermission === false && (
                <Alert variant="destructive">
                  <VideoOff className="h-4 w-4" />
                  <AlertTitle>Camera Access Denied</AlertTitle>
                  <AlertDescription>
                    Please enable camera permissions to scan the QR code.
                  </AlertDescription>
                </Alert>
              )}

              <Button variant="outline" className="w-full" onClick={stopCamera}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
              </Button>
            </div>
          )}

          {isAttendanceMarked && (
            <div className="flex flex-col items-center gap-4 text-center animate-in fade-in-50 zoom-in-95">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <h2 className="text-2xl font-semibold text-foreground">Attendance Marked!</h2>
              <p className="text-muted-foreground">Thank you, {user?.name}.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
