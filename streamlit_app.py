import streamlit as st
import streamlit.components.v1 as components
import os

# 페이지 설정
st.set_page_config(
    page_title="수면 영양제 시장 분석 대시보드",
    page_icon="🌙",
    layout="wide"
)

# 대시보드 경로 설정 (GitHub 업로드 시의 경로)
current_dir = os.path.dirname(os.path.abspath(__file__))
dashboard_folder = os.path.join(current_dir, "dashboard")

@st.cache_data
def load_dashboard():
    index_path = os.path.join(dashboard_folder, "index.html")
    if not os.path.exists(index_path):
        return f"<h3>⚠️ 대시보드 파일을 찾을 수 없습니다.</h3><p>경로: {index_path}</p>"

    with open(index_path, 'r', encoding='utf-8') as f:
        html = f.read()

    # 인라이닝 로직 (배포 환경에서 경로 문제 해결)
    assets = {
        '<link rel="stylesheet" href="style.css">': ('style.css', '<style>{}</style>'),
        '<script src="data.js"></script>': ('data.js', '<script>{}</script>'),
        '<script src="dashboard.js"></script>': ('dashboard.js', '<script>{}</script>')
    }

    for tag, (filename, template) in assets.items():
        file_path = os.path.join(dashboard_folder, filename)
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as af:
                content = af.read()
                html = html.replace(tag, template.format(content))
    
    return html

# 메인 화면
st.title("📊 수면 영양제 시장 분석 통합 대시보드")

# HTML 대시보드 렌더링
html_string = load_dashboard()
# scrolling=True와 함께 충분한 높이를 제공
components.html(html_string, height=2800, scrolling=True)

st.sidebar.markdown("""
### 🌙 Dashboard Info
- **분석 품목:** 멜라토닌 외 7종
- **업데이트:** 2026-02-28
- **제작:** Antigravity AI
""")
