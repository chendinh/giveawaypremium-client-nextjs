'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { toast } from 'sonner';
import { Loader2, Save, MapPin, Phone, User } from 'lucide-react';

import GapService from '@/app/actions/GapServices';
import { useAppStore } from '@/store/useAppStore';

// ─── Types ────────────────────────────────────────────
interface VtpSenderAddress {
  name: string;
  phone: string;
  address: string;
  province: number;
  district: number;
  ward: number;
  provinceName?: string;
  districtName?: string;
  wardName?: string;
}

interface AddressProvince {
  PROVINCE_ID: number;
  PROVINCE_NAME: string;
}

interface AddressDistrict {
  DISTRICT_ID: number;
  DISTRICT_NAME: string;
}

interface AddressWard {
  WARDS_ID: number;
  WARDS_NAME: string;
}

// ─── Hardcode defaults (địa chỉ shop hiện tại) ────────
const DEFAULT: VtpSenderAddress = {
  name: 'Giveaway Premium Store',
  phone: '0703334443',
  address: '1 Phó Đức Chính, Phường Nguyễn Thái Bình, Quận 1, HCM',
  province: 2,
  district: 43,
  ward: 773,
  provinceName: 'Hồ Chí Minh',
  districtName: 'Quận 1',
  wardName: 'Phường Nguyễn Thái Bình',
};

const SETTING_KEY = 'VTP_SENDER_ADDRESS';

// ─── Component ────────────────────────────────────────
const VtpSenderSetting: React.FC = () => {
  const { settings, setSettings, fetchSettings } = useAppStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // text fields
  const [name, setName] = useState(DEFAULT.name);
  const [phone, setPhone] = useState(DEFAULT.phone);
  const [address, setAddress] = useState(DEFAULT.address);

  // cascade lists
  const [provinces, setProvinces] = useState<AddressProvince[]>([]);
  const [districts, setDistricts] = useState<AddressDistrict[]>([]);
  const [wards, setWards] = useState<AddressWard[]>([]);

  // selected values
  const [selectedProvince, setSelectedProvince] = useState<{
    id: number;
    name: string;
  } | null>({ id: DEFAULT.province, name: DEFAULT.provinceName! });
  const [selectedDistrict, setSelectedDistrict] = useState<{
    id: number;
    name: string;
  } | null>({ id: DEFAULT.district, name: DEFAULT.districtName! });
  const [selectedWard, setSelectedWard] = useState<{
    id: number;
    name: string;
  } | null>({ id: DEFAULT.ward, name: DEFAULT.wardName! });

  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false);

  // ── Init: load provinces + saved setting + cascade lists ──
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        // Load setting + provinces song song
        const [settingData, provRes] = await Promise.all([
          fetchSettings(),
          GapService.getVtpProvinces(),
        ]);

        const provList: AddressProvince[] = Array.isArray(provRes?.result)
          ? provRes.result
          : [];
        setProvinces(provList);

        // Dùng data đã lưu nếu có, ngược lại dùng DEFAULT
        const saved = settingData?.[SETTING_KEY] as
          | VtpSenderAddress
          | undefined;
        const src: VtpSenderAddress = saved?.province ? saved : DEFAULT;

        setName(src.name || DEFAULT.name);
        setPhone(src.phone || DEFAULT.phone);
        setAddress(src.address || DEFAULT.address);

        const provinceId = Number(src.province);
        const districtId = Number(src.district);
        const wardId = Number(src.ward);

        // Tìm tên province từ list (chính xác nhất)
        const provMatch = provList.find(p => p.PROVINCE_ID === provinceId);
        const provName = provMatch?.PROVINCE_NAME || src.provinceName || '';
        setSelectedProvince({ id: provinceId, name: provName });

        // Load districts + wards song song để nhanh hơn
        setIsLoadingDistricts(true);
        setIsLoadingWards(true);

        const [distRes, wardRes] = await Promise.all([
          GapService.getVtpDistricts(provinceId),
          GapService.getVtpWards(districtId),
        ]);

        const distList: AddressDistrict[] = Array.isArray(distRes?.result)
          ? distRes.result
          : [];
        setDistricts(distList);
        setIsLoadingDistricts(false);

        const distMatch = distList.find(d => d.DISTRICT_ID === districtId);
        const distName = distMatch?.DISTRICT_NAME || src.districtName || '';
        setSelectedDistrict({ id: districtId, name: distName });

        const wardList: AddressWard[] = Array.isArray(wardRes?.result)
          ? wardRes.result
          : [];
        setWards(wardList);
        setIsLoadingWards(false);

        const wardMatch = wardList.find(w => w.WARDS_ID === wardId);
        const wardName = wardMatch?.WARDS_NAME || src.wardName || '';
        setSelectedWard({ id: wardId, name: wardName });
      } catch {
        toast.error('Không thể tải dữ liệu địa chỉ');
      }
      setIsLoading(false);
    };

    init();
  }, [fetchSettings]);

  // ── Cascade: chọn tỉnh ───────────────────────────────
  const onChangeProvince = useCallback(async (value: string) => {
    const [idStr, pName] = value.split('|');
    const id = Number(idStr);
    setSelectedProvince({ id, name: pName });
    setSelectedDistrict(null);
    setSelectedWard(null);
    setDistricts([]);
    setWards([]);

    setIsLoadingDistricts(true);
    try {
      const res = await GapService.getVtpDistricts(id);
      setDistricts(Array.isArray(res?.result) ? res.result : []);
    } catch {
      toast.error('Không thể tải danh sách quận/huyện');
    }
    setIsLoadingDistricts(false);
  }, []);

  // ── Cascade: chọn quận ───────────────────────────────
  const onChangeDistrict = useCallback(async (value: string) => {
    const [idStr, dName] = value.split('|');
    const id = Number(idStr);
    setSelectedDistrict({ id, name: dName });
    setSelectedWard(null);
    setWards([]);

    setIsLoadingWards(true);
    try {
      const res = await GapService.getVtpWards(id);
      setWards(Array.isArray(res?.result) ? res.result : []);
    } catch {
      toast.error('Không thể tải danh sách phường/xã');
    }
    setIsLoadingWards(false);
  }, []);

  // ── Cascade: chọn phường ─────────────────────────────
  const onChangeWard = useCallback((value: string) => {
    const [idStr, wName] = value.split('|');
    setSelectedWard({ id: Number(idStr), name: wName });
  }, []);

  // ── Lưu ─────────────────────────────────────────────
  const onSave = async () => {
    if (!name.trim()) return toast.error('Chưa nhập tên shop');
    if (!phone.trim()) return toast.error('Chưa nhập số điện thoại');
    if (!address.trim()) return toast.error('Chưa nhập địa chỉ chi tiết');
    if (!selectedProvince) return toast.error('Chưa chọn tỉnh/thành phố');
    if (!selectedDistrict) return toast.error('Chưa chọn quận/huyện');
    if (!selectedWard) return toast.error('Chưa chọn phường/xã');

    const vtpAddress: VtpSenderAddress = {
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      province: selectedProvince.id,
      district: selectedDistrict.id,
      ward: selectedWard.id,
      provinceName: selectedProvince.name,
      districtName: selectedDistrict.name,
      wardName: selectedWard.name,
    };

    setIsSaving(true);
    try {
      const updatedSettings = { ...settings, [SETTING_KEY]: vtpAddress };
      const res = await GapService.updateSetting(updatedSettings);
      if (res) {
        setSettings(updatedSettings);
        toast.success('Đã lưu địa chỉ shop gửi hàng');
      } else {
        toast.error('Lưu thất bại');
      }
    } catch {
      toast.error('Có lỗi xảy ra khi lưu');
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Địa chỉ shop gửi hàng ViettelPost
          <Badge variant="outline" className="text-xs font-normal">
            Dùng khi tính cước và tạo vận đơn
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tên & SĐT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-sm">
              <User className="h-3.5 w-3.5" />
              Tên người gửi / tên shop
            </Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="VD: Giveaway Premium Store"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-sm">
              <Phone className="h-3.5 w-3.5" />
              Số điện thoại
            </Label>
            <Input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="VD: 0703334443"
              maxLength={11}
            />
          </div>
        </div>

        {/* Địa chỉ chi tiết */}
        <div className="space-y-1.5">
          <Label className="text-sm">
            Địa chỉ chi tiết (số nhà, tên đường)
          </Label>
          <Input
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="VD: 1 Phó Đức Chính"
          />
        </div>

        <Separator />

        {/* Cascade địa chỉ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm">Tỉnh / Thành phố</Label>
            <SearchableSelect
              options={provinces.map(p => ({
                value: `${p.PROVINCE_ID}|${p.PROVINCE_NAME}`,
                label: p.PROVINCE_NAME,
              }))}
              value={
                selectedProvince
                  ? `${selectedProvince.id}|${selectedProvince.name}`
                  : ''
              }
              onValueChange={onChangeProvince}
              placeholder="Chọn tỉnh/thành"
              searchPlaceholder="Tìm tỉnh/thành..."
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Quận / Huyện</Label>
            <SearchableSelect
              options={districts.map(d => ({
                value: `${d.DISTRICT_ID}|${d.DISTRICT_NAME}`,
                label: d.DISTRICT_NAME,
              }))}
              value={
                selectedDistrict
                  ? `${selectedDistrict.id}|${selectedDistrict.name}`
                  : ''
              }
              onValueChange={onChangeDistrict}
              placeholder={
                isLoadingDistricts ? 'Đang tải...' : 'Chọn quận/huyện'
              }
              searchPlaceholder="Tìm quận/huyện..."
              disabled={!selectedProvince || isLoadingDistricts}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Phường / Xã</Label>
            <SearchableSelect
              options={wards.map(w => ({
                value: `${w.WARDS_ID}|${w.WARDS_NAME}`,
                label: w.WARDS_NAME,
              }))}
              value={
                selectedWard ? `${selectedWard.id}|${selectedWard.name}` : ''
              }
              onValueChange={onChangeWard}
              placeholder={isLoadingWards ? 'Đang tải...' : 'Chọn phường/xã'}
              searchPlaceholder="Tìm phường/xã..."
              disabled={!selectedDistrict || isLoadingWards}
            />
          </div>
        </div>

        {/* Preview */}
        {selectedProvince && selectedDistrict && selectedWard && (
          <div className="rounded-md bg-muted/50 border px-4 py-3 text-sm space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Địa chỉ gửi hàng
            </p>
            <p>
              <span className="text-muted-foreground">Tên:</span>{' '}
              <strong>{name || '---'}</strong>
            </p>
            <p>
              <span className="text-muted-foreground">SĐT:</span>{' '}
              {phone || '---'}
            </p>
            <p>
              <span className="text-muted-foreground">Địa chỉ:</span> {address},{' '}
              {selectedWard.name}, {selectedDistrict.name},{' '}
              {selectedProvince.name}
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Lưu địa chỉ
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VtpSenderSetting;
