# Hướng dẫn đưa dự án HRM lên Git

Hướng dẫn này dùng GitHub. GitLab hay Bitbucket làm tương tự, chỉ khác giao diện trang web và địa chỉ repo.

Tình trạng hiện tại của máy: **chưa cài Git**, dự án chưa có repo, file `.gitignore` đã có sẵn.

## Vài khái niệm trước khi làm

| Từ | Nghĩa |
|----|-------|
| Git | Chương trình chạy trên máy bạn, ghi lại lịch sử thay đổi của code |
| GitHub | Trang web lưu bản sao code trên mạng để người khác xem được |
| Repo (repository) | Một dự án được Git quản lý |
| Commit | Một lần "chụp ảnh" toàn bộ code tại một thời điểm, kèm lời ghi chú |
| Push | Đẩy các commit từ máy bạn lên GitHub |
| Pull | Kéo thay đổi từ GitHub về máy |
| Remote | Địa chỉ repo trên mạng mà máy bạn đẩy lên, thường đặt tên là `origin` |
| Branch | Một nhánh phát triển; nhánh chính thường tên là `main` |

Thứ tự làm việc luôn là: sửa code → `git add` (chọn file) → `git commit` (lưu lại trên máy) → `git push` (đẩy lên mạng).

## Bước 1. Cài Git

Mở PowerShell và chạy:

```powershell
winget install --id Git.Git -e
```

Cài xong, **đóng hẳn VS Code rồi mở lại** để terminal nhận được lệnh mới. Kiểm tra:

```powershell
git --version
```

Thấy in ra dạng `git version 2.x.x` là được. Nếu vẫn báo không nhận ra lệnh `git`, khởi động lại máy rồi thử lại.

Không dùng được `winget` thì tải bộ cài tại https://git-scm.com/download/win và bấm Next đến hết.

## Bước 2. Khai báo tên và email (chỉ làm một lần trên mỗi máy)

Git ghi tên và email này vào mỗi commit. Nên dùng đúng email của tài khoản GitHub.

```powershell
git config --global user.name "Tên của bạn"
git config --global user.email "email-github-cua-ban@gmail.com"
git config --global init.defaultBranch main
```

## Bước 3. Tạo repo trống trên GitHub

1. Đăng nhập https://github.com (chưa có tài khoản thì đăng ký).
2. Bấm dấu **+** ở góc phải trên → **New repository**.
3. **Repository name**: `hrm`.
4. Chọn **Private** nếu chỉ muốn người được mời xem, **Public** nếu ai cũng xem được.
5. **Không tích** ô nào trong "Add a README", "Add .gitignore", "Choose a license". Dự án đã có sẵn các file này; tích vào sẽ gây xung đột ở bước push.
6. Bấm **Create repository**.
7. Sao chép địa chỉ repo ở trang hiện ra, dạng `https://github.com/<tên-tài-khoản>/hrm.git`.

## Bước 4. Khởi tạo Git trong dự án

```powershell
cd D:\hrm
git init
```

Lệnh này tạo thư mục ẩn `.git` trong `D:\hrm`. Từ đây Git bắt đầu theo dõi dự án.

## Bước 5. Kiểm tra trước khi commit (quan trọng)

```powershell
git status
```

Lệnh này liệt kê những gì Git sắp đưa vào. Đọc kỹ danh sách và chắc chắn **không** thấy các mục sau:

| Không được xuất hiện | Lý do |
|----------------------|-------|
| `backend/.env` | Chứa mật khẩu database và khoá `JWT_SECRET` |
| `node_modules/` | Hàng chục nghìn file thư viện, người khác tự cài lại bằng `npm install` |
| `frontend/dist/` | Kết quả đóng gói, tạo lại được bằng `npm run build` |

Ba mục này đã được khai báo trong file `.gitignore` nên Git sẽ tự bỏ qua. Bước kiểm tra là để chắc chắn, vì một khi mật khẩu đã lên GitHub thì xoá commit cũng không coi là an toàn nữa, phải đổi mật khẩu.

Những file **nên** thấy: `backend/.env.example`, `frontend/.env.example` (file mẫu, không có giá trị thật), toàn bộ `src/`, `sql/`, `README.md`, `CLAUDE.md`.

Kiểm tra riêng file `.env` cho chắc:

```powershell
git check-ignore -v backend/.env
```

Có in ra một dòng nhắc tới `.gitignore` nghĩa là file đang được bỏ qua đúng. Không in gì nghĩa là **chưa được bỏ qua**, dừng lại và sửa `.gitignore` trước.

## Bước 6. Tạo commit đầu tiên

```powershell
git add .
git commit -m "Khoi tao du an HRM: backend, frontend, script khoi tao database"
```

- `git add .` chọn tất cả file (trừ những thứ trong `.gitignore`).
- `git commit -m "..."` lưu lại với lời ghi chú trong ngoặc kép.

Nếu thấy cảnh báo `LF will be replaced by CRLF` thì bỏ qua, đó chỉ là khác biệt ký tự xuống dòng giữa Windows và hệ điều hành khác.

## Bước 7. Nối với GitHub và đẩy lên

Thay địa chỉ bằng địa chỉ bạn đã sao chép ở bước 3:

```powershell
git remote add origin https://github.com/<tên-tài-khoản>/hrm.git
git branch -M main
git push -u origin main
```

Lần đầu push, một cửa sổ đăng nhập GitHub sẽ hiện ra. Bấm **Sign in with your browser** và đăng nhập. Máy sẽ nhớ, những lần sau không hỏi lại.

Xong thì mở lại trang repo trên GitHub và tải lại, bạn sẽ thấy toàn bộ code.

## Bước 8. Kiểm tra lại trên GitHub

- Mở thư mục `backend` trên trang web: phải **không** có file `.env`, chỉ có `.env.example`.
- Không có thư mục `node_modules`.
- File `README.md` hiển thị ngay ở trang chính của repo.

Nếu repo là Private và muốn người khác xem: vào **Settings → Collaborators → Add people**, nhập tên tài khoản GitHub của họ.

## Từ nay về sau: mỗi lần sửa code

```powershell
git status                       # xem đã sửa những file nào
git add .                        # chọn tất cả thay đổi
git commit -m "Mo ta ngan gon thay doi"
git push                         # đẩy lên GitHub
```

Viết lời ghi chú commit sao cho người đọc biết bạn đã làm gì, ví dụ `Them script khoi tao database` thay vì `update` hay `fix`.

Một vài lệnh xem thông tin:

| Lệnh | Tác dụng |
|------|----------|
| `git log --oneline` | Danh sách các commit, mỗi commit một dòng |
| `git diff` | Xem chi tiết những dòng đã sửa nhưng chưa `add` |
| `git remote -v` | Xem repo đang nối với địa chỉ nào |

## Người khác lấy code về chạy thế nào

```powershell
git clone https://github.com/<tên-tài-khoản>/hrm.git
cd hrm
```

Sau đó làm theo `README.md`: cài thư viện, tạo file `.env` từ `.env.example`, chạy `npm run db:init`.

## Lỗi thường gặp

**`git` is not recognized** — Git chưa cài, hoặc cài rồi nhưng chưa mở lại VS Code. Làm lại bước 1.

**`Author identity unknown` khi commit** — chưa khai báo tên và email. Làm bước 2 rồi commit lại.

**`remote origin already exists`** — đã nối remote rồi. Muốn đổi địa chỉ:

```powershell
git remote set-url origin https://github.com/<tên-tài-khoản>/hrm.git
```

**`rejected ... fetch first` hoặc `non-fast-forward` khi push lần đầu** — repo trên GitHub không trống, thường do đã tích "Add a README" ở bước 3. Cách đơn giản nhất: xoá repo đó trên GitHub, tạo lại repo trống và push lại.

**`Permission denied` hoặc `Authentication failed`** — đăng nhập sai tài khoản, hoặc tài khoản không có quyền với repo. Mở **Credential Manager** của Windows → **Windows Credentials**, xoá mục `git:https://github.com`, rồi push lại để đăng nhập lại.

**Lỡ commit file `.env`** — nếu **chưa push**:

```powershell
git rm --cached backend/.env
git commit -m "Bo file .env khoi git"
```

Nếu **đã push** thì coi như mật khẩu đã lộ: đổi mật khẩu database và đổi `JWT_SECRET` trong `.env`, rồi mới xử lý lịch sử commit.

**Muốn bỏ thay đổi chưa commit của một file** — lệnh dưới đây xoá vĩnh viễn những gì bạn vừa sửa trong file đó, không lấy lại được:

```powershell
git restore <đường-dẫn-file>
```
