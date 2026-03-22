# GaRutin CMS

Admin panel cho hệ thống quản lý trang trại Gà Rutin.

## Tech Stack

- **Framework**: React + Vite + TypeScript
- **UI**: Ant Design
- **Routing**: React Router
- **HTTP**: Axios
- **Build**: Vite

## Features

| Module | Mô tả |
|--------|-------|
| `auth` | Đăng nhập admin |
| `dashboard` | Tổng quan thống kê |
| `products` | Quản lý sản phẩm |
| `categories` | Quản lý danh mục |
| `orders` | Quản lý đơn hàng |
| `posts` | Quản lý bài viết blog |
| `media` | Upload ảnh lên R2 |
| `site-config` | Cấu hình website |

## Setup

```bash
# Clone
git clone git@github.com-vinctuyen2601:vinctuyen2601/GaRutinCMS.git
cd GaRutinCMS

# Cài dependencies
npm install

# Cấu hình môi trường
cp .env.example .env
# Sửa VITE_API_URL trong .env

# Chạy development
npm run dev
```

## Cấu hình môi trường

```env
VITE_API_URL=https://api.garutin.com/api
```

## Build Production

```bash
npm run build
```

Deploy thư mục `dist/` lên Vercel hoặc bất kỳ static hosting nào.
