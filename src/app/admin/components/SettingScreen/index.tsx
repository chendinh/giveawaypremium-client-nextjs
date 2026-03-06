'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Settings, Monitor } from 'lucide-react';

import BookingSetting from './Components/BookingSetting';
import ConfigConsignmentId from './Components/ConfigConsignmentId';
// import MonitorList from './Components/MonitorList';

import './style.scss';

const SettingScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('booking');

  return (
    <div className="setting-screen-container p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="booking" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Cài đặt Booking</span>
          </TabsTrigger>
          <TabsTrigger value="consignment" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Cài đặt Đợt KG</span>
          </TabsTrigger>
          <TabsTrigger value="monitor" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            <span className="hidden sm:inline">Monitor</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="booking">
          <BookingSetting />
        </TabsContent>

        <TabsContent value="consignment">
          <ConfigConsignmentId />
        </TabsContent>

        {/* <TabsContent value="monitor">
          <MonitorList />
        </TabsContent> */}
      </Tabs>
    </div>
  );
};

export default SettingScreen;
