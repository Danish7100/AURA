
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, QrCode, ArrowLeft, VideoOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addAttendanceRecord, students } from "@/app/lib/data";
import jsQR from "jsqr";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// In a real app with authentication, you would get the logged-in student's ID.
// For this mock version, we'll let the user pick a student.
const MOCK_STUDENT = students[Math.floor(Math.random() * students.length)];

export function StudentDashboard() {
  const { toast } = useToast();
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

      const tick = () => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code) {
            handleQrCodeData(code.data);
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
    setIsAttendanceMarked(false); // Reset attendance status
    setIsScanning(true);
    setHasCameraPermission(null);

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        streamRef.current = stream;
        setHasCameraPermission(true);
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    } catch (err) {
        console.error("Camera access error:", err);
        setHasCameraPermission(false);
        setIsScanning(false);
        toast({
            variant: "destructive",
            title: "Camera Access Denied",
            description: "Please enable camera permissions in your browser settings to scan QR codes.",
        });
    }
  };

  const handleQrCodeData = (qrCodeDataString: string | null) => {
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

          addAttendanceRecord({
            sessionId: qrCodeData.sessionId,
            studentId: MOCK_STUDENT.id,
            studentName: MOCK_STUDENT.name,
            timestamp: Date.now(),
          });

          setIsAttendanceMarked(true);
          setLastSessionId(qrCodeData.sessionId);
          toast({
            title: "Success!",
            description: `Attendance marked. Welcome, ${MOCK_STUDENT.name}!`,
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
              <p className="text-sm text-muted-foreground">You are signed in as (mock user): <strong>{MOCK_STUDENT.name}</strong></p>
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
              <p className="text-muted-foreground">Thank you, {MOCK_STUDENT.name}.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
