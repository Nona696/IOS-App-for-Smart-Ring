import { useState, useEffect } from "react";
import { BleClient, BleDevice } from '@capacitor/bluetooth-le';
import { toast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { HeartPulse, Activity, Moon, MapPin } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const DA14531_SERVICE = '0000180d-0000-1000-8000-00805f9b34fb'; // Heart Rate Service UUID
const HEART_RATE_CHARACTERISTIC = '00002a37-0000-1000-8000-00805f9b34fb';
const OXYGEN_CHARACTERISTIC = '00002a62-0000-1000-8000-00805f9b34fb';

const useBluetoothManager = () => {
  const [device, setDevice] = useState<BleDevice | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const initializeBLE = async () => {
      try {
        await BleClient.initialize();
      } catch (error) {
        toast({
          title: "Bluetooth Error",
          description: "Failed to initialize Bluetooth",
          variant: "destructive",
        });
      }
    };

    initializeBLE();
  }, []);

  const scanAndConnect = async () => {
    try {
      const device = await BleClient.requestDevice({
        services: [DA14531_SERVICE],
        name: 'SmartRing'
      });

      await BleClient.connect(device.deviceId);
      setDevice(device);
      setIsConnected(true);

      toast({
        title: "Connected",
        description: "Successfully connected to Smart Ring",
      });
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to connect to Smart Ring",
        variant: "destructive",
      });
    }
  };

  const disconnect = async () => {
    if (device) {
      await BleClient.disconnect(device.deviceId);
      setDevice(null);
      setIsConnected(false);
    }
  };

  return {
    isConnected,
    scanAndConnect,
    disconnect
  };
};

interface HealthData {
  heartRate: number;
  oxygenLevel: number;
  sleepPhase: string;
  steps: number;
  timestamp: number;
}

const Index = () => {
  const { isConnected, scanAndConnect, disconnect } = useBluetoothManager();
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [currentData, setCurrentData] = useState<HealthData>({
    heartRate: 0,
    oxygenLevel: 0,
    sleepPhase: "Unknown",
    steps: 0,
    timestamp: Date.now(),
  });

  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        const newData = {
          heartRate: 60 + Math.random() * 20,
          oxygenLevel: 95 + Math.random() * 3,
          sleepPhase: ["Light", "Deep", "REM"][Math.floor(Math.random() * 3)],
          steps: currentData.steps + Math.floor(Math.random() * 10),
          timestamp: Date.now(),
        };
        setCurrentData(newData);
        setHealthData(prev => [...prev, newData].slice(-100));
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [isConnected, currentData]);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Smart Ring Monitor</h1>
          <Button onClick={isConnected ? disconnect : scanAndConnect} variant={isConnected ? "destructive" : "default"}>
            {isConnected ? "Disconnect" : "Connect Smart Ring"}
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Heart Rate</CardTitle>
              <HeartPulse className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(currentData.heartRate)} BPM</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blood Oxygen</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(currentData.oxygenLevel)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sleep Phase</CardTitle>
              <Moon className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentData.sleepPhase}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Steps</CardTitle>
              <MapPin className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentData.steps}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;