import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Search, Printer, AlertCircle, Droplet, Maximize2 } from 'lucide-react';
import heroMolecule from './assets/hero_molecule.png';
import './App.css';

const KOSHA_API_KEY = 'e979878bd9f70b89c6938bdf18f088a8f99d1c762c5252bbdc5c4275c72f7fb2';

interface PubChemInfo {
  cid: number;
  formula: string;
  weight: string;
  iupac: string;
  inchiKey: string;
  has3d: boolean;
}

interface ChemblInfo {
  id: string;
  maxPhase: string | number;
  prefName: string;
  moleculeType: string;
}

interface MsdsDetail {
  title: string;
  content: Record<string, string>;
}

interface ChemBasicInfo {
  chemNameKor: string;
  casNo: string;
  keNo: string;
  unNo: string;
  enNo: string;
}

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [pubchemInfo, setPubchemInfo] = useState<PubChemInfo | null>(null);
  const [chemblInfo, setChemblInfo] = useState<ChemblInfo | null>(null);
  const [msdsData, setMsdsData] = useState<MsdsDetail[]>([]);
  const [chemBasicInfo, setChemBasicInfo] = useState<ChemBasicInfo | null>(null);
  const [style3d, setStyle3d] = useState<'stick' | 'sphere' | 'line'>('sphere');
  const [hasInteracted3D, setHasInteracted3D] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const renderFormula = (formula: string) => {
    if (!formula || formula === '-') return '-';
    return formula.split(/(\d+)/).map((part, i) => {
      if (/^\d+$/.test(part)) return <sub key={i}>{part}</sub>;
      return part;
    });
  };

  const parseXML = (xmlString: string) => {
    const parser = new DOMParser();
    return parser.parseFromString(xmlString, "text/xml");
  };

  const fetchMSDSDetails = async (chemId: string) => {
    const details: MsdsDetail[] = [];
    const titles = [
      "화학제품과 회사에 관한 정보", "유해성·위험성", "구성성분의 명칭 및 함유량",
      "응급조치 요령", "폭발·화재 시 대처방법", "누출 사고 시 대처방법",
      "취급 및 저장방법", "노출방지 및 개인보호구", "물리화학적 특성",
      "안정성 및 반응성", "독성에 관한 정보", "환경에 미치는 영향",
      "폐기시 주의사항", "운송에 필요한 정보", "법적 규제현황", "그 밖의 참고사항"
    ];

    for (let i = 1; i <= 15; i++) {
      const idxStr = i.toString().padStart(2, '0');
      try {
        const detailUrl = `/api/msds/getChemDetail${idxStr}?ServiceKey=${KOSHA_API_KEY}&chemId=${chemId}`;
        const detailRes = await axios.get(detailUrl);
        const detailXml = parseXML(detailRes.data);
        const detailItems = detailXml.querySelectorAll('item');
        
        const contentMap: Record<string, string> = {};
        detailItems.forEach(dItem => {
          const name = dItem.querySelector('msdsItemNameKor')?.textContent || '항목';
          const val = dItem.querySelector('itemDetail')?.textContent || '-';
          contentMap[name] = val;
        });

        if (Object.keys(contentMap).length > 0) {
          details.push({
            title: `${i}. ${titles[i-1] || '상세정보'}`,
            content: contentMap
          });
        }
      } catch (err) {
        console.warn(`Failed to fetch detail ${idxStr}`, err);
      }
    }
    setMsdsData(details);
  };

  const fetchPubChem = async (word: string) => {
    try {
      const cidRes = await axios.get(`/api/pubchem/compound/name/${encodeURIComponent(word)}/cids/JSON`);
      const cid = cidRes.data.IdentifierList.CID[0];

      const propRes = await axios.get(`/api/pubchem/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,IUPACName,InChIKey/JSON`);
      const props = propRes.data.PropertyTable.Properties[0];

      let has3d = false;
      try {
        await axios.head(`/api/pubchem/compound/cid/${cid}/record/SDF/?record_type=3d`);
        has3d = true;
      } catch(e) { has3d = false; }

      setPubchemInfo({
        cid,
        formula: props.MolecularFormula || '-',
        weight: props.MolecularWeight || '-',
        iupac: props.IUPACName || '-',
        inchiKey: props.InChIKey || '-',
        has3d
      });
    } catch (err) {
      console.warn("PubChem 정보를 찾을 수 없습니다.", word);
      setPubchemInfo(null);
    }
  };

  const fetchChEMBL = async (word: string) => {
    try {
      const res = await axios.get(`https://www.ebi.ac.uk/chembl/api/data/molecule/search?q=${encodeURIComponent(word)}&format=json`);
      const molecule = res.data.molecules?.[0];
      if (molecule) {
        setChemblInfo({
          id: molecule.molecule_chembl_id || '-',
          maxPhase: molecule.max_phase ?? '-',
          prefName: molecule.pref_name || '-',
          moleculeType: molecule.molecule_type || '-'
        });
      } else {
        setChemblInfo(null);
      }
    } catch(err) {
      console.warn("ChEMBL 정보를 찾을 수 없습니다.", word);
      setChemblInfo(null);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    setError(null);
    setMsdsData([]);
    setPubchemInfo(null);
    setChemblInfo(null);
    setChemBasicInfo(null);
    setHasInteracted3D(false);

    try {
      const cleanSearchTerm = searchTerm.trim();
      const isCasNo = /^\d+-\d{2}-\d$/.test(cleanSearchTerm);
      const searchCnd = isCasNo ? '1' : '0';
      const listUrl = `/api/msds/getChemList?ServiceKey=${KOSHA_API_KEY}&searchWrd=${encodeURIComponent(cleanSearchTerm)}&searchCnd=${searchCnd}&numOfRows=1`;
      const listRes = await axios.get(listUrl);
      const listXml = parseXML(listRes.data);
      const item = listXml.querySelector('item');
      
      if (!item) {
        throw new Error('KOSHA MSDS에서 해당 물질을 찾을 수 없습니다.');
      }
      
      const chemId = item.querySelector('chemId')?.textContent;
      const casNo = item.querySelector('casNo')?.textContent;
      const engName = item.querySelector('chemNameEng')?.textContent;
      const chemNameKor = item.querySelector('chemNameKor')?.textContent || '-';
      const keNo = item.querySelector('keNo')?.textContent || '-';
      const unNo = item.querySelector('unNo')?.textContent || '-';
      const enNo = item.querySelector('enNo')?.textContent || '-';
      
      if (!chemId) throw new Error('chemId를 찾을 수 없습니다.');

      setChemBasicInfo({
        chemNameKor,
        casNo: casNo || '-',
        keNo,
        unNo,
        enNo
      });

      // PubChem/ChEMBL 검색어 결정: CAS 번호 우선, 그 다음 영문명, 마지막으로 원본 검색어
      let queryForGlobal = cleanSearchTerm;
      if (casNo && casNo !== '설정안됨' && casNo !== '-' && casNo !== '영업비밀') {
        queryForGlobal = casNo;
      } else if (engName && engName !== '설정안됨' && engName !== '-' && engName !== '영업비밀') {
        queryForGlobal = engName;
      }

      await Promise.allSettled([
        fetchMSDSDetails(chemId),
        fetchPubChem(queryForGlobal),
        fetchChEMBL(queryForGlobal)
      ]);
    } catch (err: any) {
      setError(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pubchemInfo?.has3d && viewerRef.current) {
      viewerRef.current.innerHTML = '';
      if (!(window as any).$3Dmol) {
        const script = document.createElement('script');
        script.src = 'https://3Dmol.org/build/3Dmol-min.js';
        script.onload = render3D;
        document.head.appendChild(script);
      } else {
        render3D();
      }
    }
  }, [pubchemInfo, style3d]);

  const render3D = () => {
    if (!viewerRef.current) return;
    
    viewerRef.current.innerHTML = '';
    const glViewer = (window as any).$3Dmol.createViewer(viewerRef.current, {
      backgroundColor: '#ffffff'
    });
    
    axios.get(`/api/pubchem/compound/cid/${pubchemInfo?.cid}/record/SDF/?record_type=3d`)
      .then(res => {
        glViewer.addModel(res.data, 'sdf');
        if (style3d === 'stick') {
          glViewer.setStyle({}, { stick: {}, sphere: { radius: 0.4 } });
        } else if (style3d === 'sphere') {
          glViewer.setStyle({}, { sphere: {} });
        } else if (style3d === 'line') {
          glViewer.setStyle({}, { line: {} });
        }
        glViewer.zoomTo();
        glViewer.render();
      }).catch(console.error);
  };

  return (
    <>
      <div className="main-header-wrapper">
        <div className="main-header-content">
          <div className="logo-section">
            <Droplet size={32} color="var(--primary)" />
            <span className="app-title">EasyMSDS</span>
          </div>
          <div className="header-actions">
            <form className="search-section" onSubmit={handleSearch}>
              <input 
                type="text" 
                className="search-input" 
                placeholder="화학물질명 또는 CAS No. 입력 (예: 벤젠, 71-43-2)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <Search size={18} /> 검색
              </button>
            </form>
            <button className="btn btn-secondary print-button" onClick={handlePrint} disabled={msdsData.length === 0}>
              <Printer size={18} /> PDF 저장 / 인쇄
            </button>
          </div>
        </div>
      </div>
      <div className="app-container">

      {!loading && !error && msdsData.length === 0 && !pubchemInfo && !chemBasicInfo && (
        <div className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">더 쉽고 빠른 <br/><span className="highlight">MSDS 데이터 검색</span></h1>
            <p className="hero-subtitle">화학물질명 또는 CAS 번호로 안전보건공단 및 글로벌 데이터베이스의 물질 정보를 한눈에 확인하세요.</p>
          </div>
          <div className="hero-image-wrapper">
            <img src={heroMolecule} alt="Molecular Structure" className="hero-image" />
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-container">
          <svg className="chem-spinner" width="80" height="80" viewBox="0 0 100 100">
            <polygon points="50,10 85,30 85,70 50,90 15,70 15,30" fill="none" stroke="var(--primary)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="50" cy="10" r="6" fill="var(--secondary)" />
            <circle cx="85" cy="70" r="6" fill="var(--accent)" />
            <circle cx="15" cy="70" r="6" fill="var(--primary)" />
            <circle cx="50" cy="50" r="4" fill="var(--border)" />
          </svg>
          <div className="loading-text">화학물질 데이터를 분석하고 있습니다...</div>
        </div>
      )}
      {error && <div className="error"><AlertCircle size={24} style={{verticalAlign: 'middle', marginRight: 8}}/>{error}</div>}

      {!loading && !error && (msdsData.length > 0 || pubchemInfo || chemblInfo || chemBasicInfo) && (
        <div ref={printRef} style={{ padding: '20px' }}>
          
          {/* Top: Basic Chem Info Table */}
          {chemBasicInfo && (
            <div className="card" style={{ marginBottom: '20px' }}>
              <h2 className="card-title">기본 물질 정보</h2>
              <div className="msds-table">
                <div className="msds-row">
                  <div className="msds-key">물질명</div>
                  <div className="msds-val">{chemBasicInfo.chemNameKor}</div>
                </div>
                <div className="msds-row">
                  <div className="msds-key">CAS No.</div>
                  <div className="msds-val">{chemBasicInfo.casNo}</div>
                </div>
                <div className="msds-row">
                  <div className="msds-key">KE No.</div>
                  <div className="msds-val">{chemBasicInfo.keNo}</div>
                </div>
                <div className="msds-row">
                  <div className="msds-key">UN No.</div>
                  <div className="msds-val">{chemBasicInfo.unNo}</div>
                </div>
                <div className="msds-row">
                  <div className="msds-key">EU No.</div>
                  <div className="msds-val">{chemBasicInfo.enNo}</div>
                </div>
              </div>
            </div>
          )}

          {/* Middle: Visuals side by side */}
          {pubchemInfo && (
            <div className="card" style={{ marginBottom: '20px' }}>
              <h2 className="card-title">분자 정보 및 구조 (PubChem / ChEMBL)</h2>
              
              <div className="visuals-container">
                <div className="visual-box-wrapper">
                  <h3 style={{fontSize: '16px', color: 'var(--text-h)', marginBottom: '10px'}}>2D 구조</h3>
                  <div className="visual-box">
                    <img 
                      className="structure-img"
                      src={`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${pubchemInfo.cid}/PNG?record_type=2d&image_size=large`} 
                      alt="2D Structure" 
                    />
                  </div>
                </div>
                
                <div className="visual-box-wrapper">
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '10px'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                      <Maximize2 size={18} color="#16a34a" />
                      <h3 style={{fontSize: '16px', color: 'var(--text-h)', margin: 0, fontWeight: 'bold'}}>3D 분자 상호작용 모델</h3>
                    </div>
                    {pubchemInfo.has3d && (
                      <div className="style3d-buttons">
                        <button 
                          className={`style3d-btn ${style3d === 'stick' ? 'active' : ''}`}
                          onClick={() => { setStyle3d('stick'); setHasInteracted3D(true); }}
                        >STICK</button>
                        <button 
                          className={`style3d-btn ${style3d === 'sphere' ? 'active' : ''}`}
                          onClick={() => { setStyle3d('sphere'); setHasInteracted3D(true); }}
                        >SPHERE</button>
                        <button 
                          className={`style3d-btn ${style3d === 'line' ? 'active' : ''}`}
                          onClick={() => { setStyle3d('line'); setHasInteracted3D(true); }}
                        >LINE</button>
                      </div>
                    )}
                  </div>
                  <div className="visual-box">
                    {pubchemInfo.has3d ? (
                      <>
                        <div ref={viewerRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}></div>
                        {!hasInteracted3D && (
                          <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(255,255,255,0.9)', padding: '8px 16px', borderRadius: '20px', color: 'var(--primary)', fontWeight: 'bold', pointerEvents: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 10 }}>
                            💡 STICK를 클릭하세요
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{color:'var(--text-muted)'}}>3D 구조 정보가 없습니다.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="info-grid" style={{ marginTop: '1.5rem' }}>
                <div className="info-item">
                  <div className="info-label">화학식 (Formula)</div>
                  <div className="info-value">{renderFormula(pubchemInfo.formula)}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">분자량 (Weight)</div>
                  <div className="info-value">{pubchemInfo.weight} g/mol</div>
                </div>
                <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                  <div className="info-label">IUPAC 명칭</div>
                  <div className="info-value">{pubchemInfo.iupac}</div>
                </div>
                
                {chemblInfo && (
                  <>
                    <div className="info-item">
                      <div className="info-label">ChEMBL ID</div>
                      <div className="info-value">{chemblInfo.id}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Max Phase / Type</div>
                      <div className="info-value">{chemblInfo.maxPhase} / {chemblInfo.moleculeType}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Bottom: MSDS Details */}
          <div className="card">
            <h2 className="card-title">물질안전보건자료 (KOSHA MSDS) 전체 정보</h2>
            <div className="msds-section">
              {msdsData.length > 0 ? msdsData.map((section, idx) => (
                <div key={idx} className="msds-block">
                  <div className="msds-block-title">{section.title}</div>
                  <div className="msds-table">
                    {Object.entries(section.content).map(([k, v], i) => (
                      <div key={i} className="msds-row">
                        <div className="msds-key">{k}</div>
                        <div className="msds-val">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )) : <div style={{color: 'var(--text-muted)'}}>KOSHA MSDS 정보가 없습니다.</div>}
            </div>
          </div>

        </div>
      )}
    </div>
    </>
  );
}

export default App;
