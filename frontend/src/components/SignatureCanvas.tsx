import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button, Space } from 'antd';
import { ClearOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface SignatureCanvasProps {
  width?: number;
  height?: number;
  onChange?: (base64: string | null) => void;
}

const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  width = 400,
  height = 150,
  onChange,
}) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [width, height]);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  }, [getPos]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }, [isDrawing, getPos]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setHasSignature(true);
    const canvas = canvasRef.current;
    if (canvas && onChange) {
      onChange(canvas.toDataURL('image/png'));
    }
  }, [isDrawing, onChange]);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    setHasSignature(false);
    if (onChange) onChange(null);
  }, [width, height, onChange]);

  return (
    <div>
      <div style={{
        border: '2px dashed var(--gray-200)',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'crosshair',
        position: 'relative',
      }}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{ display: 'block', width: '100%', height }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'var(--gray-300)', fontSize: 14, pointerEvents: 'none',
          }}>
            {t('emr.signatureDrawHint')}
          </div>
        )}
      </div>
      <Space style={{ marginTop: 8 }}>
        <Button
          size="small"
          icon={<ClearOutlined />}
          onClick={clear}
          disabled={!hasSignature}
        >
          {t('emr.clearSignature')}
        </Button>
      </Space>
    </div>
  );
};

export default SignatureCanvas;
