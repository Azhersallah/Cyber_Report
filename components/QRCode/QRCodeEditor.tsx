import React from 'react';
import { useApp } from '../../store/AppContext';
import { getTranslation } from '../../utils/translations';
import { Link, Mail, Phone, MessageSquare, Wifi, MapPin, Type } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

type QRType = 'text' | 'url' | 'email' | 'phone' | 'sms' | 'wifi' | 'location';

export const QRCodeEditor: React.FC = () => {
  const { state, dispatch } = useApp();
  const qrData = state.qrCodeData;
  const t = (key: string) => getTranslation(key, state.language);
  const isKurdish = state.language === 'ku';

  const updateQRData = (updates: Partial<typeof qrData>) => {
    dispatch({
      type: 'UPDATE_QR_CODE_DATA',
      payload: updates
    });
  };

  const getTypeIcon = (type: QRType) => {
    switch (type) {
      case 'url': return <Link size={16} />;
      case 'email': return <Mail size={16} />;
      case 'phone': return <Phone size={16} />;
      case 'sms': return <MessageSquare size={16} />;
      case 'wifi': return <Wifi size={16} />;
      case 'location': return <MapPin size={16} />;
      default: return <Type size={16} />;
    }
  };

  const qrTypes: { id: QRType; label: string }[] = [
    { id: 'text', label: isKurdish ? 'تێکست' : 'Text' },
    { id: 'url', label: isKurdish ? 'لینک' : 'URL' },
    { id: 'email', label: isKurdish ? 'ئیمەیڵ' : 'Email' },
    { id: 'phone', label: isKurdish ? 'تەلەفۆن' : 'Phone' },
    { id: 'sms', label: 'SMS' },
    { id: 'wifi', label: 'WiFi' },
    { id: 'location', label: isKurdish ? 'شوێن' : 'Location' },
  ];

  return (
    <div className={cn("h-full overflow-y-auto bg-background", isKurdish ? 'font-kufi' : 'font-sans')} dir={isKurdish ? 'rtl' : 'ltr'}>
      <div className="p-4 space-y-6">
        
        {/* Type Selection */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-muted-foreground uppercase">
            {isKurdish ? 'جۆری QR' : 'QR Type'}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {qrTypes.map((type) => (
              <Button
                key={type.id}
                variant={qrData.type === type.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateQRData({ type: type.id })}
                className="justify-start h-9"
              >
                {getTypeIcon(type.id)}
                <span className="text-xs">{type.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Content Input */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-muted-foreground uppercase">
            {isKurdish ? 'ناوەڕۆک' : 'Content'}
          </label>
          
          {qrData.type === 'wifi' ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1.5 block">
                  {isKurdish ? 'ناوی تۆڕ (SSID)' : 'Network Name (SSID)'}
                </label>
                <input
                  type="text"
                  value={qrData.wifiSSID}
                  onChange={(e) => updateQRData({ wifiSSID: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background"
                  placeholder="My WiFi"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">
                  {isKurdish ? 'وشەی نهێنی' : 'Password'}
                </label>
                <input
                  type="text"
                  value={qrData.wifiPassword}
                  onChange={(e) => updateQRData({ wifiPassword: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background"
                  placeholder="password123"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">
                  {isKurdish ? 'جۆری پاراستن' : 'Security Type'}
                </label>
                <select
                  value={qrData.wifiSecurity}
                  onChange={(e) => updateQRData({ wifiSecurity: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background"
                >
                  <option value="WPA">WPA/WPA2</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">{isKurdish ? 'بێ وشەی نهێنی' : 'No Password'}</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="wifi-hidden"
                  checked={qrData.wifiHidden}
                  onChange={(e) => updateQRData({ wifiHidden: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="wifi-hidden" className="text-sm">
                  {isKurdish ? 'تۆڕی شاراوە' : 'Hidden Network'}
                </label>
              </div>
            </div>
          ) : qrData.type === 'location' ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1.5 block">
                  {isKurdish ? 'پانی (Latitude)' : 'Latitude'}
                </label>
                <input
                  type="text"
                  value={qrData.latitude}
                  onChange={(e) => updateQRData({ latitude: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background"
                  placeholder="36.191111"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">
                  {isKurdish ? 'درێژی (Longitude)' : 'Longitude'}
                </label>
                <input
                  type="text"
                  value={qrData.longitude}
                  onChange={(e) => updateQRData({ longitude: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background"
                  placeholder="44.009167"
                  dir="ltr"
                />
              </div>
            </div>
          ) : (
            <textarea
              value={qrData.content}
              onChange={(e) => updateQRData({ content: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background min-h-[100px] resize-y"
              placeholder={
                qrData.type === 'url' ? 'https://example.com' :
                qrData.type === 'email' ? 'example@email.com' :
                qrData.type === 'phone' ? '+964 771 234 5678' :
                qrData.type === 'sms' ? '+964 771 234 5678' :
                isKurdish ? 'تێکست بنوسە...' : 'Enter text...'
              }
              dir={qrData.type === 'url' || qrData.type === 'email' ? 'ltr' : undefined}
            />
          )}
        </div>

        {/* Customization */}
        <div className="space-y-4 pt-4 border-t border-border">
          <label className="text-xs font-semibold text-muted-foreground uppercase">
            {isKurdish ? 'تایبەتکردن' : 'Customization'}
          </label>

          {/* Size */}
          <div>
            <label className="text-xs font-medium mb-2 block">
              {isKurdish ? 'قەبارە' : 'Size'}: {qrData.size}px
            </label>
            <input
              type="range"
              min="128"
              max="512"
              step="32"
              value={qrData.size}
              onChange={(e) => updateQRData({ size: Number(e.target.value) })}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-2 block">
                {isKurdish ? 'ڕەنگی QR' : 'QR Color'}
              </label>
              <input
                type="color"
                value={qrData.fgColor}
                onChange={(e) => updateQRData({ fgColor: e.target.value })}
                className="w-full h-10 rounded-md border border-border cursor-pointer"
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-2 block">
                {isKurdish ? 'پاشبنەما' : 'Background'}
              </label>
              <input
                type="color"
                value={qrData.bgColor}
                onChange={(e) => updateQRData({ bgColor: e.target.value })}
                className="w-full h-10 rounded-md border border-border cursor-pointer"
              />
            </div>
          </div>

          {/* Error Correction */}
          <div>
            <label className="text-xs font-medium mb-2 block">
              {isKurdish ? 'ڕاستکردنەوەی هەڵە' : 'Error Correction'}
            </label>
            <select
              value={qrData.errorLevel}
              onChange={(e) => updateQRData({ errorLevel: e.target.value as any })}
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background"
            >
              <option value="L">Low (7%)</option>
              <option value="M">Medium (15%)</option>
              <option value="Q">Quartile (25%)</option>
              <option value="H">High (30%)</option>
            </select>
          </div>

          {/* Margin */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="include-margin"
              checked={qrData.includeMargin}
              onChange={(e) => updateQRData({ includeMargin: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="include-margin" className="text-sm">
              {isKurdish ? 'بۆشایی لە دەوروبەر' : 'Include Margin'}
            </label>
          </div>

          {/* Logo */}
          <div className="pt-4 border-t border-border">
            <label className="text-xs font-medium mb-2 block">
              {isKurdish ? 'لۆگۆی ناوەڕاست' : 'Center Logo'}
            </label>
            {qrData.logoImage ? (
              <div className="space-y-3">
                <img 
                  src={qrData.logoImage} 
                  alt="Logo" 
                  className="w-20 h-20 object-contain border rounded-md mx-auto bg-muted/50 p-2" 
                />
                <div>
                  <label className="text-xs mb-2 block">
                    {isKurdish ? 'قەبارەی لۆگۆ' : 'Logo Size'}: {qrData.logoSize}%
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="30"
                    value={qrData.logoSize}
                    onChange={(e) => updateQRData({ logoSize: Number(e.target.value) })}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => updateQRData({ logoImage: null })}
                  className="w-full"
                >
                  {isKurdish ? 'لۆگۆ بسڕەوە' : 'Remove Logo'}
                </Button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        updateQRData({ logoImage: event.target?.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                  id="logo-upload"
                />
                <label htmlFor="logo-upload">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <span>{isKurdish ? 'لۆگۆ باربکە' : 'Upload Logo'}</span>
                  </Button>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
