// 1. 초기 데이터 로드 (data.js를 통해 전역 변수 dashboardData가 로드됨)
function init() {
    if (!dashboardData) {
        console.error("데이터가 로드되지 않았습니다. data.js 파일을 확인하세요.");
        return;
    }

    setupEventListeners(); // 클릭 불가 오류 방지를 위해 리스너 우선 등록
    setupKeywordFilter();
    updateDashboard('all');
}

// 2. 키워드 필터 설정
function setupKeywordFilter() {
    const filter = document.getElementById('keyword-filter');
    dashboardData.keywords.forEach(kw => {
        const opt = document.createElement('option');
        opt.value = kw;
        opt.textContent = kw;
        filter.appendChild(opt);
    });
}

// 3. 대시보드 업데이트 (필터 적용)
function updateDashboard(keyword) {
    const filteredKeywords = keyword === 'all' ? dashboardData.keywords : [keyword];


    // 차트 렌더링
    renderOverviewCharts(filteredKeywords);
    renderTrendCharts(filteredKeywords, 'total');
    renderBlogContent(keyword);
    renderShopCharts(keyword);
    renderInsights(filteredKeywords);
}

// 4. 이벤트 리스너
function setupEventListeners() {
    // 탭 전환
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
            window.dispatchEvent(new Event('resize')); // 차트 리사이즈 대응
        });
    });

    // 키워드 필터 변경
    document.getElementById('keyword-filter').addEventListener('change', (e) => {
        updateDashboard(e.target.value);
    });

    // 테마 토글
    document.getElementById('theme-toggle').addEventListener('click', () => {
        const body = document.body;
        const icon = document.getElementById('theme-icon');
        if (body.classList.contains('light-mode')) {
            body.classList.replace('light-mode', 'dark-mode');
            icon.setAttribute('data-lucide', 'sun');
        } else {
            body.classList.replace('dark-mode', 'light-mode');
            icon.setAttribute('data-lucide', 'moon');
        }
        lucide.createIcons();
    });

    // 트렌드 세그먼트 토글
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const kw = document.getElementById('keyword-filter').value;
            renderTrendCharts(kw === 'all' ? dashboardData.keywords : [kw], btn.dataset.segment);
        });
    });
}

// --- 차트 렌더링 엔진 (ApexCharts) ---

function renderOverviewCharts(keywords) {
    // 1. 관심도 비중 (전체 검색량 합계 기반)
    const blogData = keywords.map(kw => {
        const sumRatio = dashboardData.trends.total.filter(d => d.keyword === kw).reduce((a, b) => a + b.ratio, 0);
        return { x: kw, y: Math.round(sumRatio) };
    });

    // 2. 브랜드 다양성 비중 (쇼핑 데이터 내 실제 고유 브랜드 총 수 기반 - 동일 수치 오류 해결)
    const shopData = keywords.map(kw => {
        const brandCount = dashboardData.supplements[kw].unique_brand_count;
        return { x: kw, y: brandCount };
    });

    renderPie("#blog-pie-chart", blogData.map(d => d.y), blogData.map(d => d.x), "성분별 관심도 비중");

    renderPie("#shop-pie-chart", shopData.map(d => d.y), shopData.map(d => d.x), "성분별 브랜드 다양성");

    // 3. 인구통계별 상세 파이 차트 추가
    const segments = [
        { id: "male", name: "남성", container: "#male-pie-chart" },
        { id: "female", name: "여성", container: "#female-pie-chart" },
        { id: "age2030", name: "2030대", container: "#age2030-pie-chart" },
        { id: "age4050", name: "4050대", container: "#age4050-pie-chart" }
    ];

    segments.forEach(seg => {
        const data = keywords.map(kw => {
            const sum = dashboardData.trends[seg.id].filter(d => d.keyword === kw).reduce((a, b) => a + b.ratio, 0);
            return { x: kw, y: Math.round(sum) };
        });
        renderPie(seg.container, data.map(d => d.y), data.map(d => d.x), `${seg.name} 선호도`);
    });
}

// 파이 차트 공통 렌더러
function renderPie(selector, series, labels, title) {
    const container = document.querySelector(selector);
    container.innerHTML = "";
    new ApexCharts(container, {
        series: series,
        labels: labels,
        chart: { type: 'donut', height: 280 },
        stroke: { show: false },
        dataLabels: { enabled: false },
        plotOptions: { pie: { donut: { size: '65%' } } },
        legend: { position: 'bottom', fontSize: '12px' },
        theme: { palette: 'palette1' }
    }).render();
}

function renderTrendCharts(keywords, segment) {
    const series = keywords.map(kw => {
        const raw = dashboardData.trends[segment].filter(d => d.keyword === kw);
        return {
            name: kw,
            data: raw.map(d => ({ x: d.period, y: Math.round(d.ratio * 100) / 100 }))
        };
    });

    const options = {
        series: series,
        chart: { type: 'line', height: 400, toolbar: { show: false }, zoom: { enabled: false } },
        stroke: { curve: 'smooth', width: 3 },
        xaxis: { type: 'datetime' },
        yaxis: { title: { text: '관심도 (Ratio)' } },
        tooltip: { x: { format: 'yyyy-MM-dd' } },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#71717a']
    };

    const container = document.querySelector("#trend-line-chart");
    container.innerHTML = "";
    new ApexCharts(container, options).render();

    // Demo Bar Charts (4개 세그먼트별 독립 렌더링)
    const demoSegments = [
        { id: 'male', name: '남성', container: '#male-bar-chart', color: '#3b82f6' },
        { id: 'female', name: '여성', container: '#female-bar-chart', color: '#10b981' },
        { id: 'age2030', name: '2030대', container: '#age2030-bar-chart', color: '#f59e0b' },
        { id: 'age4050', name: '4050대', container: '#age4050-bar-chart', color: '#8b5cf6' }
    ];

    demoSegments.forEach(seg => {
        const seriesData = keywords.map(kw => {
            const vals = dashboardData.trends[seg.id].filter(d => d.keyword === kw).map(d => d.ratio);
            const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
            return { x: kw, y: Math.round(avg * 100) / 100 };
        });

        // 데이터 정렬 (내림차순)
        seriesData.sort((a, b) => b.y - a.y);

        const container = document.querySelector(seg.container);
        if (container) {
            container.innerHTML = "";
            new ApexCharts(container, {
                series: [{ name: seg.name, data: seriesData.map(d => d.y) }],
                chart: { type: 'bar', height: 300, toolbar: { show: false } },
                plotOptions: { bar: { borderRadius: 4, horizontal: true } },
                xaxis: { categories: seriesData.map(d => d.x) },
                colors: [seg.color],
                title: { text: `${seg.name} 평균 관심도`, align: 'center', style: { fontSize: '12px' } }
            }).render();
        }
    });
}

function renderBlogContent(filterKeyword) {
    const container = document.getElementById('blog-items-container');
    if (!container) return;
    container.innerHTML = "";

    const keywordsToShow = filterKeyword === 'all' ? dashboardData.keywords : [filterKeyword];

    keywordsToShow.forEach(kw => {
        const blogs = dashboardData.supplements[kw].blogs;
        const sortedBlogs = [...blogs].sort((a, b) => (b.visitor_count || 0) - (a.visitor_count || 0));

        const card = document.createElement('div');
        card.className = "blog-list-card glass-card";
        card.innerHTML = `
            <h3><span class="kw-badge">${kw}</span> 상위 영향력 포스팅</h3>
            <div class="blog-table-scroll">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>순위</th>
                            <th>방문자수</th>
                            <th>날짜</th>
                            <th>제목</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedBlogs.slice(0, 10).map((b, i) => `
                            <tr>
                                <td><span class="rank-badge">${i + 1}</span></td>
                                <td class="visitor-val">${(b.visitor_count || 0).toLocaleString()}</td>
                                <td class="date-cell">${b.postdate}</td>
                                <td class="title-cell"><a href="${b.link}" target="_blank">${b.title}</a></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderShopCharts(filterKeyword) {
    const container = document.getElementById('shop-items-container');
    if (!container) return;
    container.innerHTML = "";

    const keywordsToShow = filterKeyword === 'all' ? dashboardData.keywords : [filterKeyword];

    keywordsToShow.forEach(kw => {
        const shops = dashboardData.supplements[kw].shops;
        // 리뷰수 내림차순 정렬 (이미 export_data.py에서 되어있지만 재확인)
        const sortedShops = [...shops].sort((a, b) => (b.review_count || 0) - (a.review_count || 0));

        const card = document.createElement('div');
        card.className = "blog-list-card glass-card";
        card.innerHTML = `
            <h3><span class="kw-badge">${kw}</span> 주요 상품 랭킹 (리뷰순)</h3>
            <div class="blog-table-scroll">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>순위</th>
                            <th>이미지</th>
                            <th>중복</th>
                            <th>상품명</th>
                            <th>가격</th>
                            <th>리뷰</th>
                            <th>평점</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedShops.slice(0, 10).map((s, i) => `
                            <tr class="${s.is_duplicate ? 'duplicate-row' : ''}">
                                <td><span class="rank-badge">${i + 1}</span></td>
                                <td>
                                    <div class="product-thumb-container">
                                        <img src="${s.image}" alt="${s.title}" class="product-thumb" onerror="this.src='https://via.placeholder.com/40?text=No+Img'">
                                    </div>
                                </td>
                                <td class="dup-status">${s.is_duplicate ? 'O' : 'X'}</td>
                                <td class="title-cell"><a href="${s.link}" target="_blank">${s.title}</a></td>
                                <td class="price-val">${(s.lprice || 0).toLocaleString()}원</td>
                                <td class="review-val">${(s.review_count || 0).toLocaleString()}</td>
                                <td>
                                    <div class="score-container">
                                        <span class="score-num">${(s.review_score || 0).toFixed(1)}</span>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        container.appendChild(card);
    });

    renderMarketAnalysis(keywordsToShow);
}

function renderMarketAnalysis(keywords) {
    const data = keywords.map(kw => ({
        kw,
        brandCount: dashboardData.supplements[kw].unique_brand_count || 0,
        avgPrice: dashboardData.supplements[kw].avg_price || 0
    }));

    // (1) 평균 가격 비교 (세로 막대)
    renderBar("#shop-price-chart", data.map(d => d.avgPrice), data.map(d => d.kw), "평균 가격 (원)", "#3b82f6");

    // (2) 브랜드 등록 현황 (세로 막대)
    renderBar("#shop-brand-count-chart", data.map(d => d.brandCount), data.map(d => d.kw), "브랜드 등록 수", "#10b981");
}

// 바 차트 공통 헬퍼 (세로 막대로 수정)
function renderBar(selector, seriesData, categories, title, color = '#3b82f6') {
    const container = document.querySelector(selector);
    if (!container) return;
    container.innerHTML = "";
    new ApexCharts(container, {
        series: [{ name: title, data: seriesData }],
        chart: {
            type: 'bar',
            height: 400,
            width: '100%', // 너비 100% 강제
            toolbar: { show: false },
            redrawOnParentResize: true, // 부모 크기 변경 대응
            animations: { enabled: true }
        },
        xaxis: { categories: categories },
        grid: {
            padding: {
                left: 10,
                right: 10
            }
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                horizontal: false,
                columnWidth: '55%',
                dataLabels: { position: 'top' }
            }
        },
        dataLabels: {
            enabled: true,
            formatter: (val) => val.toLocaleString(),
            offsetY: -20,
            style: { fontSize: '12px', colors: ["#304758"] }
        },
        title: { text: title, align: 'center' },
        colors: [color]
    }).render();
}

function renderInsights(keywords) {
    const sortedKws = keywords; // 이미 export_data에서 정렬되어 옴
    const supplements = dashboardData.supplements;

    // (1) 시장 총평 및 방향성 생성
    const totalKeywords = sortedKws.length;
    const topByPrice = [...sortedKws].sort((a, b) => supplements[b].avg_price - supplements[a].avg_price)[0];
    const topByBrand = [...sortedKws].sort((a, b) => supplements[b].unique_brand_count - supplements[a].unique_brand_count)[0];

    const directionHtml = `
        <p>분석된 <strong>${totalKeywords}종</strong>의 수면 보조제 시장은 품목별로 <b>초양극화 현상</b>이 관측됩니다.</p>
        <ul class="insight-list">
            <li><strong>고관여 중심:</strong> ${topByPrice} 성분은 평균 단가가 가장 높으며 프리미엄 시장을 형성하고 있습니다.</li>
            <li><strong>레드오션 심화:</strong> ${topByBrand} 성분은 가장 많은 브랜드가 진입하여 치열한 PB 경쟁이 지속되고 있습니다.</li>
            <li><strong>전망:</strong> 단순 수면 유도를 넘어 '피로회복', '긴장완화' 등 복합 기능성을 강조한 제품으로 소비자 관심이 이동하는 추세입니다.</li>
        </ul>
    `;
    document.getElementById('insight-market-direction').innerHTML = directionHtml;

    // (2) 마케팅 전략 생성
    const strategyHtml = `
        <ul class="insight-list">
            <li><strong>브랜딩 전략:</strong> 중복 상품 비중이 높은 품목에서는 '원료사 인증' 및 '함량 차별화' 로 신뢰 중심 마케팅 필요.</li>
            <li><strong>가격 전략:</strong> 시장 평균가 대비 15% 내외의 가성비 라인 혹은 아예 2배 이상의 고가 전략으로 중간 지대를 피해야 함.</li>
            <li><strong>타겟팅:</strong> 연령별 관심 키워드(성장기 테아닌, 노년기 멜라토닌 등)를 매칭한 세그먼트 마케팅 강화.</li>
        </ul>
    `;
    document.getElementById('insight-marketing-strategy').innerHTML = strategyHtml;

    // (3) 품목별 상세 방향성 생성
    const itemInsightContainer = document.getElementById('item-specific-insights');
    itemInsightContainer.innerHTML = "";

    const itemAdvice = {
        "멜라토닌": "직구 시장 의존도 탈피를 위해 '천연 유래' 정체성 강조 및 수면 패브릭 등과 연계한 라이프스타일 접근 권장.",
        "타트체리": "일반 주스 형태에서 고농축 젤리나 정제 형태로의 제형 변경을 통해 '영양제'로서의 실효성 이미지 강화 필요.",
        "마그네슘": "근육 이완뿐만 아니라 '신경 안정' 기능을 부각하여 스트레스가 많은 직장인 대상의 서브 건강기능식품으로 안착.",
        "GABA": "심리적 안정(Antianxiety)과 연계하여 수험생 및 취준생 대상의 '멘탈 케어' 시장 선점 전략 유효.",
        "락티움": "우유 유래 성분의 안전성을 바탕으로 영유아 부모나 임산부 등 까다로운 타겟을 향한 니치 마켓 공략.",
        "테아닌": "카페인 부작용 완화 기능과 결합하여 직장인들의 '오전 업무용 웰니스 음료' 시장 확장 가능성 농후.",
        "트립토판": "행복 호르몬 '세로토닌' 생성 경로를 강조하여 계절성 우울감이나 감정 기복 케어 제품으로 포지셔닝.",
        "감태추출물": "국내산 원료의 프리미엄 이미지와 '깊은 수면 시간 측정' 등 수면 앱과 연동한 기술 기반 마케팅 선호."
    };

    sortedKws.forEach(kw => {
        const data = supplements[kw];
        const card = document.createElement('div');
        card.className = 'item-insight-card glass-card';
        card.innerHTML = `
            <div class="item-header">
                <span class="item-name">${kw}</span>
                <span class="item-stats">평균가: ${data.avg_price.toLocaleString()}원</span>
            </div>
            <p class="item-advice">${itemAdvice[kw] || "시장 지표 기반 지속적인 모니터링 및 브랜드 정체성 구축이 필요한 단계입니다."}</p>
        `;
        itemInsightContainer.appendChild(card);
    });
}

// 초기화 실행
init();
