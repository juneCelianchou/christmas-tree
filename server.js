import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp'; // <--- 引入 sharp
import cors from 'cors';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = 3000;
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));
// === 路径配置 ===
const photoDir = path.join(__dirname, 'public','photos');
const thumbDir = path.join(__dirname, 'public','thumbnails'); // 新增缩略图目录

// 确保文件夹存在
if (!fs.existsSync(photoDir)) fs.mkdirSync(photoDir);
if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true }); // 创建缩略图文件夹

// Multer 配置
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, photoDir);
    },
    filename: function (req, file, cb) {
        file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage });

// === API 接口 ===

// 获取图片列表
app.get('/api/photos', (req, res) => {
    fs.readdir(photoDir, (err, files) => {
        if (err) return res.status(500).json({ error: '无法读取目录' });

        // 过滤图片
        const images = files.filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
        res.json(images);
    });
});

// 上传图片接口 (核心修改部分)
app.post('/api/upload', upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: '请选择文件' });

    try {
        // === 使用 sharp 生成缩略图 ===
        // 1. 获取原图路径
        const originalPath = path.join(photoDir, req.file.filename);
        // 2. 设定缩略图路径
        const thumbPath = path.join(thumbDir, req.file.filename);

        // 3. 调整大小并保存 (宽度调整为 200px，高度自适应，质量 80%)
        await sharp(originalPath)
            .resize(200)
            .jpeg({ quality: 80 })
            .toFile(thumbPath);

        res.json({ message: '上传成功', filename: req.file.filename });
    } catch (error) {
        console.error('缩略图生成失败:', error);
        // 即使缩略图失败，原图也上传成功了，但也算成功吧，或者你可以返回错误
        res.json({ message: '上传成功(缩略图生成失败)', filename: req.file.filename });
    }
});

// 删除图片接口
app.delete('/api/photo/:filename', (req, res) => {
    const filename = req.params.filename;
    const originalPath = path.join(photoDir, filename);
    const thumbPath = path.join(thumbDir, filename); // 也要删除缩略图

    // 删除原图
    if (fs.existsSync(originalPath)) {
        fs.unlink(originalPath, (err) => {
            if (err) console.error(err);

            // 顺便尝试删除缩略图 (如果存在)
            if (fs.existsSync(thumbPath)) {
                fs.unlinkSync(thumbPath);
            }

            res.json({ message: '删除成功' });
        });
    } else {
        res.status(404).json({ message: '文件不存在' });
    }
});

// 启动服务
app.listen(PORT, '0.0.0.0', () => {
    console.log(`服务器已启动`);// 这是一个辅助函数，如果没有就算了，不重要
});