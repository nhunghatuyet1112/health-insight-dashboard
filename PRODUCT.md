# Health Insight

<!-- impeccable:product-schema 1 -->

## Platform

Ứng dụng web wellness sử dụng React, TypeScript, Vite, Zustand, shadcn/ui, Tailwind CSS v4 và Recharts. Node server cung cấp API AI và phục vụ bản build production.

## Users

Người trưởng thành muốn hiểu dữ liệu thiết bị đeo, cải thiện giấc ngủ và duy trì vận động. Nhân vật demo là Nguyễn Minh Anh, làm công việc văn phòng.

## Product Purpose

Giúp người dùng đi từ **dữ liệu → hiểu xu hướng → chọn hành động thực tế** thông qua tổng hợp dữ liệu, biểu đồ, nhật ký, mục tiêu và trợ lý AI.

## Positioning

Ba trụ cột chính là **Activity, Sleep, Recovery**. Dashboard, insights, mục tiêu, export và bằng chứng cho AI dùng chung một lớp analytics xác định. Chỉ số được tính bằng code; AI diễn giải bằng chứng đã xử lý.

## Operating Context

- Luồng chính: **Landing → Explore Demo → Overview**, không cần tài khoản hoặc bước cá nhân hóa.
- Dữ liệu tổng hợp cố định gồm **60 ngày, 20/08–18/10/2026**, theo GMT+7; không tự dịch theo ngày hiện tại.
- Mặc định kết nối ba nguồn mô phỏng: Apple Health, Garmin Connect và Strava.
- Mục tiêu, khoảng thời gian, trạng thái kết nối, quyền dữ liệu và nhật ký lưu trong trình duyệt bằng localStorage. Không có cơ sở dữ liệu người dùng hoặc đồng bộ giữa thiết bị.
- Hội thoại AI giữ trong bộ nhớ khi điều hướng hoặc thu nhỏ chat. Thay đổi nguồn, quyền hoặc nhật ký bắt đầu hội thoại mới.
- Các URL đăng nhập và onboarding cũ chuyển về demo. `#/reference` và `#/first-day` là bản xem lưu trữ, ngoài điều hướng sản phẩm chính.

## Capabilities and Constraints

### Các khu vực chức năng

| Khu vực | Route | Chức năng |
| --- | --- | --- |
| Overview | `#/demo`, `#/dashboard` | Tổng quan chỉ số, xu hướng và tiến độ; chọn 7D/30D. |
| Health Insights | `#/insights/activity`, `#/insights/sleep`, `#/insights/recovery` | Phân tích từng trụ cột, lịch sử, bằng chứng và độ phủ dữ liệu. |
| Wellness Journal | `#/journal` | Thêm, sửa, xóa check-in năng lượng/căng thẳng, khung giờ ngủ và buổi tập thủ công. |
| Goals | `#/goals` | Chỉnh mục tiêu bước/ngày, giờ ngủ/đêm, phút vận động/tuần và theo dõi tiến độ. |
| Devices & Integrations | `#/integrations` | Chọn quyền từng loại dữ liệu; mô phỏng kết nối, sync, ngắt kết nối, lỗi, retry và Reset Demo. |

Trợ lý AI dạng chat nổi hỗ trợ hỏi đáp trên dữ liệu cả ba trụ cột. UI dùng tiếng Anh; trợ lý trả lời theo ngôn ngữ câu hỏi.

### Dữ liệu hiển thị trên UI

Các giá trị phụ thuộc khoảng 7D/30D, nguồn đang kết nối, quyền được cấp, mục tiêu cá nhân và nhật ký. Không cố định các con số minh họa thành kết quả của người dùng.

**Thông tin chung:** tên nhân vật demo, tên màn hình, khoảng phân tích, khoảng so sánh trước đó và các nguồn đóng góp. Nhãn synthetic/mock và thông báo không có cảm biến trực tiếp giúp nhận biết dữ liệu mô phỏng. Nút Export tải báo cáo JSON theo phạm vi đang chọn.

**Overview — bốn thẻ KPI:**

| Chỉ số | Giá trị chính | Thông tin đi kèm |
| --- | --- | --- |
| Steps | Số bước trung bình/ngày có dữ liệu | Đơn vị bước/ngày, số ngày ghi nhận và chênh lệch số bước so với kỳ trước. |
| Active minutes | Tổng phút vận động ghi nhận trong kỳ | Đơn vị phút, số ngày ghi nhận và chênh lệch tổng phút so với kỳ trước. |
| Sleep | Số giờ ngủ trung bình/đêm có dữ liệu | Đơn vị giờ/đêm, số ngày ghi nhận và chênh lệch so với kỳ trước quy đổi ra phút. |
| Resting heart rate | Nhịp tim nghỉ trung bình | Đơn vị bpm, số ngày ghi nhận và chênh lệch bpm so với kỳ trước. |

Mỗi thẻ thể hiện độ phủ dạng số ngày ghi nhận/tổng ngày. Khi độ phủ thấp có nhãn `Limited data`; khi không đủ điều kiện so sánh có `Comparison unavailable`.

Overview còn hiển thị:

- Biểu đồ theo ngày, chọn một trong bốn chỉ số; tooltip cho ngày và giá trị. Steps và Sleep có đường mục tiêu cá nhân nét đứt.
- Bảng mở rộng daily records: ngày, bước, phút vận động, giờ ngủ, nhịp tim nghỉ; mỗi ô có nguồn tương ứng hoặc nhãn thiếu dữ liệu/ước tính thủ công.
- Lịch sử tập luyện: số buổi duy nhất, loại hoạt động, ngày, nguồn đóng góp, nhãn gộp bản trùng, thời lượng phút, quãng đường km và nhịp tim trung bình buổi tập nếu có.
- Check-in trong kỳ: ngày, năng lượng và căng thẳng theo thang 1–5, nhãn tự báo cáo.
- Tiến độ ba mục tiêu và các khối bảy ngày hoàn chỉnh có tổng phút vận động thực ghi nhận.
- Các nhận xét tính bằng code: tiêu đề, bằng chứng quan sát, hành động gợi ý và liên kết khám phá trụ cột liên quan; có nhãn phân biệt với trợ lý LLM.

**Health Insights:**

| Tab | Dữ liệu hiển thị |
| --- | --- |
| Activity | Biểu đồ bước hoặc active minutes theo ngày; độ phủ, dữ liệu kỳ trước, bảng daily records, nhận xét vận động và lịch sử tập luyện. |
| Sleep | Biểu đồ giờ ngủ với đường mục tiêu; dữ liệu kỳ trước; biến thiên giờ đi ngủ hiện tại/kỳ trước và biến thiên giờ thức dậy, đơn vị phút; lịch sử gồm ngày, giờ ngủ, giờ thức, thời lượng và nguồn. |
| Recovery | Biểu đồ nhịp tim nghỉ theo ngày; dữ liệu kỳ trước; nhận xét xu hướng; baseline nhịp tim nghỉ lịch sử và số ngày quan sát tạo baseline. Không hiển thị HRV hoặc điểm phục hồi. |

**Wellness Journal:** form thay đổi theo loại bản ghi; lịch sử lọc theo kỳ đang chọn và hiển thị số mục.

- Check-in: ngày, năng lượng 1–5, căng thẳng 1–5, ghi chú tùy chọn.
- Sleep window: giờ đi ngủ/thức dậy GMT+7, chất lượng ngủ tự đánh giá 1–5, lựa chọn ưu tiên wearable hoặc manual, ghi chú; lịch sử hiển thị thêm số giờ ước tính và nguồn ưu tiên.
- Workout: loại hoạt động, giờ bắt đầu, thời lượng phút, quãng đường km tùy chọn, cường độ cảm nhận 1–5 tùy chọn, xác nhận buổi riêng khi trùng giờ và ghi chú. Lịch sử hiện tại hiển thị loại, thời gian, thời lượng, quãng đường và nhãn manual; cường độ được nhập/lưu nhưng chưa hiển thị lại trong thẻ lịch sử.
- Trạng thái lưu thành công, lỗi kiểm tra dữ liệu, chỉnh sửa và xác nhận xóa. Ghi chú có thể đọc lại tại lịch sử nhật ký và không gửi cho AI.

**Goals:** hiển thị ba mục tiêu có thể sửa, giá trị hiện tại/mục tiêu, phần trăm hoàn thành, thanh tiến độ và độ phủ. Steps/Sleep có số ngày đạt mục tiêu trên số ngày ghi nhận. Activity thể hiện nhịp tuần ước tính; phần `Observed weekly exercise` liệt kê từng khối bảy ngày hoàn chỉnh, tổng phút/mục tiêu, số ngày có dữ liệu và trạng thái đủ dữ liệu/đạt/chưa đạt. Thanh tiến độ dừng ở 100% nhưng nhãn giữ phần trăm thực tế.

**Devices & Integrations:** mỗi nguồn có tên, mô tả dữ liệu, nhãn `MOCK`, trạng thái kết nối/đồng bộ/lỗi, thời điểm sync mô phỏng gần nhất theo GMT+7 và lỗi nếu có. Apple/Garmin có quyền steps, active minutes, sleep, resting HR và workouts; Strava chỉ có workouts. Checkbox thể hiện quyền đang bật. Khi sync lại lỗi, UI cho biết dữ liệu cũ được giữ.

**AI chat:** hiển thị lời chào, kỳ dữ liệu mô phỏng, câu hỏi gợi ý, tin nhắn người dùng và trạng thái đang xử lý. Phản hồi gồm phần trả lời, bằng chứng với giá trị/đơn vị/kỳ/độ phủ và thông tin kỳ trước khi áp dụng, hành động đề xuất và câu hỏi tiếp theo. Lỗi API có thông báo và retry; không hiển thị câu trả lời giả thay thế.

**Trạng thái thiếu dữ liệu:** giá trị thiếu thể hiện bằng `—` hoặc thông báo phù hợp; biểu đồ giữ khoảng đứt. Khi toàn bộ chỉ số không có quan sát, khu vực biểu đồ có empty state và liên kết quản lý nguồn. Khi không còn dữ liệu ngày hoặc buổi tập, trang có lời nhắc kết nối nguồn; lịch sử nhật ký/tập luyện có thông báo khi rỗng.

### Quy tắc dữ liệu

- `src/features/health/model.ts`, `demo.ts`, `entries.ts` và `engine.ts` định nghĩa mô hình, fixture, dữ liệu thủ công và phép tính dùng chung cho frontend/server.
- Ưu tiên Apple Health cho chỉ số ngày và giấc ngủ, Garmin làm nguồn thay thế khi thiếu. Không cộng các tổng ngày của nhiều nguồn với nhau.
- Gộp buổi tập trùng theo event ID của fixture, ưu tiên chi tiết Strava → Garmin → Apple và giữ nguồn đóng góp. Không cộng thêm thời lượng buổi tập vào active minutes đã nhập từ nguồn.
- Ngắt nguồn hoặc thu hồi quyền loại dữ liệu tương ứng khỏi analytics, biểu đồ, export và ngữ cảnh AI. Kết nối mới chỉ đóng góp sau khi thành công; resync thất bại giữ dữ liệu đã kết nối trước đó.
- `null` là thiếu dữ liệu và tạo khoảng đứt trên biểu đồ; số `0` đã ghi nhận vẫn hợp lệ. Trung bình bỏ qua `null`, giữ số `0`; chỉ số có thông tin độ phủ.
- 7D/30D so với kỳ liền trước có cùng số ngày. So sánh chỉ số cần ít nhất **70% ngày có dữ liệu ở cả hai kỳ**.
- Mục tiêu bước và ngủ dựa trên trung bình ngày có dữ liệu. Nhịp vận động tuần là trung bình active minutes/ngày có dữ liệu × 7, phân biệt với tổng phút thực đo trong kỳ.
- Recovery dùng nhịp tim nghỉ và thay đổi theo thời gian; không có Health Score hoặc điểm phục hồi tổng hợp.

### Nhật ký thủ công

- Tối đa 100 mục; mỗi ngày báo cáo có tối đa một check-in và một khung giờ ngủ thủ công. Năng lượng/căng thẳng là tự đánh giá trên thang 1–5.
- Giấc ngủ gắn với ngày thức dậy theo GMT+7, dài hơn 0 và không quá 24 giờ. Khi trùng wearable, người dùng chọn ưu tiên nguồn nào; không cộng hai bản ghi. Khung giờ thủ công là ước tính thời gian trên giường.
- Buổi tập thủ công giữ nhãn nguồn riêng, không làm tăng active minutes nhập từ wearable. Nếu giờ bắt đầu cách buổi tập nhập từ nguồn không quá 15 phút, cần xác nhận đây là buổi riêng.

### Ranh giới AI

- Gọi OpenAI Responses qua `POST /api/chat`; `/api/assistant` là alias. Cần cấu hình server `OPENAI_API_KEY` (hoặc alias cũ `LLM_API_KEY`) và `LLM_MODEL`.
- Server kiểm tra đầu vào và tính lại analytics từ nguồn, quyền, mục tiêu và dữ liệu thủ công hợp lệ; không tin chỉ số tính sẵn từ trình duyệt.
- AI nhận bằng chứng đã xử lý của cả ba trụ cột. Số liệu bằng chứng được server tra cứu. Ghi chú nhật ký tự do không gửi lên API AI; request tới OpenAI dùng `store: false`.
- Không thay bằng câu trả lời kịch bản khi API lỗi. Thiếu cấu hình, timeout, rate limit, từ chối hoặc output không hợp lệ có trạng thái lỗi rõ ràng và hỗ trợ thử lại.
- Không chẩn đoán, tư vấn thuốc, bịa dữ liệu thiếu hoặc kết luận nhân quả từ tương quan. Guardrails không thay thế xác thực lâm sàng.

### Giới hạn MVP

Không có authentication, wearable OAuth thật, Live Workout Mode, module dinh dưỡng hoặc sức khỏe tinh thần. Kết nối và số đo đều mô phỏng; check-in wellness không phải một module sức khỏe tinh thần. Server hiện phục vụ demo cục bộ; triển khai công khai cần đánh giá thêm cấu hình hosting và rate limiting. Tài liệu này không xác nhận đã deploy hoặc đã gọi LLM thật thành công.

## Brand Commitments

Tên hiển thị là **Health Insight**. Giữ UI tiếng Anh và thiết kế **health-insight-ui-kit-2.4**. `DESIGN.md` quy định bố cục; `src/design-system/tokens.json` là nguồn token chuẩn, `theme.css` được sinh tự động. Dashboard dùng chung `DashboardShell`, `DashboardPanel` và `DashboardButton`.

## Evidence on Hand

Cơ sở hiện có gồm đặc tả, code, HTML tham chiếu, ảnh baseline và fixture tổng hợp có thể tái tạo. Bộ test kiểm tra dữ liệu/analytics và ranh giới chat với provider giả lập; không chứng minh một lần gọi LLM thật thành công. Không có số đo bệnh nhân thật, cảm biến trực tiếp, xác thực lâm sàng hoặc kết quả sức khỏe đã kiểm chứng.

## Product Principles

- Dùng chung một nguồn tính toán cho toàn bộ trải nghiệm.
- Tính chỉ số bằng code, dùng AI để giải thích bằng chứng.
- Phân biệt thiếu dữ liệu, số 0 đã ghi nhận và dữ liệu tự báo cáo.
- Giữ nguồn gốc, độ phủ và nhãn mô phỏng rõ ràng.
- Ưu tiên hiểu dữ liệu, khám phá và hành động thực tế.
- Giữ API key ở server; không đưa vào biến `VITE_*` hoặc UI.

Chi tiết chạy dự án, cấu hình AI và kiểm tra nằm trong [README.md](README.md); quy tắc giao diện nằm trong [DESIGN.md](DESIGN.md).

Các màn hình đang hoạt động dùng chung UI Kit v2.4 qua `src/components/ui/health-kit.tsx`, `Button`, `RatingScale` và các adapter trong `DashboardSystem`. Danh sách component và nơi áp dụng nằm ở `src/design-system/ADOPTION.md`; migration giao diện không thay đổi analytics, quyền dữ liệu hoặc phạm vi AI.
