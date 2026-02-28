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
# streamlit_app.py와 dashboard 폴더가 같은 루트에 있다고 가정합니다.
current_dir = os.path.dirname(os.path.abspath(__file__))
dashboard_path = os.path.join(current_dir, "dashboard", "index.html")

@st.cache_data
def load_dashboard():
    if os.path.exists(dashboard_path):
        with open(dashboard_path, 'r', encoding='utf-8') as f:
            return f.read()
    else:
        return f"<h3>⚠️ 대시보드 파일을 찾을 수 없습니다.</h3><p>현재 경로: {dashboard_path}</p>"

# 메인 화면
st.title("📊 수면 영양제 시장 분석 통합 대시보드")

# HTML 대시보드 렌더링
html_string = load_dashboard()
# scrolling=True와 함께 충분한 높이(2800)를 제공하여 모든 내용이 보이게 합니다.
components.html(html_string, height=2800, scrolling=True)

st.sidebar.markdown("""
### 🌙 Dashboard Info
- **분석 품목:** 멜라토닌 외 7종
- **업데이트:** 2026-02-28
- **제작:** Antigravity AI
""")
