'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import TableConsignmentScreen from './components/TableConsignemntScreen';
// import TableProductScreen from './components/TableProduct';
// import TableOrder from './components/TableOrder';
// import TableCustomer from './components/TableCustomer';
// import TableAppointment from './components/TableAppointment';
// import TableEmailScreen from './components/TableEmailScreen';
// import TableRequestOrder from './components/TableRequestOrder';

import './style.scss';

const ManageScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('1');

  return (
    <div className="managescreen-container p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap gap-1 mb-6">
          <TabsTrigger value="1">Ký gửi</TabsTrigger>
          <TabsTrigger value="2">Sản phẩm</TabsTrigger>
          <TabsTrigger value="3">Chiến dịch</TabsTrigger>
          <TabsTrigger value="4">Đơn hàng</TabsTrigger>
          <TabsTrigger value="5">Khách hàng</TabsTrigger>
          <TabsTrigger value="6">Lịch hẹn</TabsTrigger>
          <TabsTrigger value="7">Email</TabsTrigger>
          <TabsTrigger value="8">Hàng Chờ</TabsTrigger>
        </TabsList>

        <TabsContent value="1">
          <TableConsignmentScreen />
        </TabsContent>

        <TabsContent value="2">
          {/* <TableProductScreen /> */}
          <div className="text-muted-foreground text-center py-10">
            Sản phẩm (chưa convert)
          </div>
        </TabsContent>

        <TabsContent value="3">
          <div className="text-muted-foreground text-center py-10">
            Chiến dịch (chưa convert)
          </div>
        </TabsContent>

        <TabsContent value="4">
          {/* <TableOrder /> */}
          <div className="text-muted-foreground text-center py-10">
            Đơn hàng (chưa convert)
          </div>
        </TabsContent>

        <TabsContent value="5">
          {/* <TableCustomer /> */}
          <div className="text-muted-foreground text-center py-10">
            Khách hàng (chưa convert)
          </div>
        </TabsContent>

        <TabsContent value="6">
          {/* <TableAppointment /> */}
          <div className="text-muted-foreground text-center py-10">
            Lịch hẹn (chưa convert)
          </div>
        </TabsContent>

        <TabsContent value="7">
          {/* <TableEmailScreen /> */}
          <div className="text-muted-foreground text-center py-10">
            Email (chưa convert)
          </div>
        </TabsContent>

        <TabsContent value="8">
          {/* <TableRequestOrder /> */}
          <div className="text-muted-foreground text-center py-10">
            Hàng Chờ (chưa convert)
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ManageScreen;
