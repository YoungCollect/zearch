// Node.js script to generate icon files
// Run with: node generate-icon.js

const fs = require('fs');
const { createCanvas } = require('canvas');

function drawIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    const center = size / 2;
    const radius = size * 0.4;
    
    // 清除画布
    ctx.clearRect(0, 0, size, size);
    
    // 绘制背景圆形
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#3b82f6');
    gradient.addColorStop(1, '#1d4ed8');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.fill();
    
    // 绘制边框
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = size > 32 ? 2 : 1;
    ctx.stroke();
    
    if (size >= 32) {
        // 绘制搜索图标
        ctx.strokeStyle = 'white';
        ctx.lineWidth = size > 64 ? 3 : 2;
        ctx.lineCap = 'round';
        
        const searchRadius = size * 0.15;
        const searchX = center - size * 0.1;
        const searchY = center - size * 0.1;
        
        ctx.beginPath();
        ctx.arc(searchX, searchY, searchRadius, 0, 2 * Math.PI);
        ctx.stroke();
        
        // 搜索手柄
        const handleStart = searchRadius * 0.7;
        ctx.beginPath();
        ctx.moveTo(searchX + handleStart, searchY + handleStart);
        ctx.lineTo(searchX + handleStart + size * 0.08, searchY + handleStart + size * 0.08);
        ctx.stroke();
    }
    
    // 绘制屏蔽符号
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = size > 64 ? 4 : (size > 32 ? 3 : 2);
    ctx.lineCap = 'round';
    
    // 屏蔽圆圈
    ctx.beginPath();
    ctx.arc(center, center, radius * 0.8, 0, 2 * Math.PI);
    ctx.stroke();
    
    // 屏蔽斜线
    const lineOffset = radius * 0.6;
    ctx.beginPath();
    ctx.moveTo(center - lineOffset, center - lineOffset);
    ctx.lineTo(center + lineOffset, center + lineOffset);
    ctx.stroke();
    
    if (size >= 48) {
        // 绘制Z字母
        ctx.fillStyle = 'white';
        ctx.font = `bold ${size * 0.2}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Z', center, center + radius * 0.6);
    }
    
    return canvas;
}

// 生成不同尺寸的图标
const sizes = [16, 32, 48, 128];

sizes.forEach(size => {
    const canvas = drawIcon(size);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`assets/icon-${size}.png`, buffer);
    console.log(`Generated icon-${size}.png`);
});

console.log('All icons generated successfully!');
