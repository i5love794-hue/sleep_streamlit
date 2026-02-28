import streamlit as st
import streamlit.components.v1 as components
import os

# 페이지 설정
st.set_page_config(
    page_title="수면 영양제 시장 분석 대시보드",
    page_icon="🌙",
    layout="wide"
)

# 대시보드 경로 설정
# GitHub 업로드 시 dashboard 폴더가 루트에 있는 것을 기준으로 합니다.
dashboard_path = os.path.join(os.getcwd(), "dashboard", "index.html")

def load_dashboard():
    if os.path.exists(dashboard_path):
        with open(dashboard_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
            # 폰트와 라이브러리 경로가 로컬 상대 경로일 경우를 대비해 처리 (필요시)
            return html_content
    else:
        return "<h3>대시보드 파일을 찾을 수 없습니다. dashboard/index.html 경로를 확인해주세요.</h3>"

# 메인 화면
st.title("📊 수면 영양제 시장 분석 통합 대시보드")

# HTML 대시보드 렌더링 (전체화면 높이 확보)
html_string = load_dashboard()
components.html(html_string, height=2500, scrolling=True)

st.sidebar.markdown("""
### 🌙 Dashboard Info
- **분석 품목:** 멜라토닌 외 7종
- **업데이트:** 2026-02-28
- **제작:** Antigravity AI
""")
