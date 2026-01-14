import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Lock, LogOut, Search, X } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';

// Firebase 설정 (동일한 데이터베이스 사용)
const firebaseConfig = {
  apiKey: "AIzaSyBt-2DpZfQVM35YBajQEJI0D8LSN1HzL_4",
  authDomain: "temple-management-49ae1.firebaseapp.com",
  databaseURL: "https://temple-management-49ae1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "temple-management-49ae1",
  storageBucket: "temple-management-49ae1.firebasestorage.app",
  messagingSenderId: "753617201876",
  appId: "1:753617201876:web:6ebd3c15c76dd3db536941"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export default function TempleViewSystem() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [believers, setBelievers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBeliever, setSelectedBeliever] = useState(null);
  const [showBulsaPopup, setShowBulsaPopup] = useState(false);
  const [viewPhotoModal, setViewPhotoModal] = useState(false);
  const [viewPhotoUrl, setViewPhotoUrl] = useState('');
  const [showOnlyHighValue, setShowOnlyHighValue] = useState(false);

  // "(서비스)" 문자열 제거 함수
  const removeServiceText = (text) => {
    if (!text) return text;
    return text.replace(/\(서비스\)/g, '').trim();
  };

  // 100만원 이상 불사내용이 있는지 확인하는 함수
  const hasHighValueBulsa = (believer) => {
    if (!believer.bulsa || believer.bulsa.length === 0) return false;
    return believer.bulsa.some(b => {
      // amount 필드에서 금액 확인
      const amount = b.amount || 0;
      return amount >= 1000000;
    });
  };

  useEffect(() => {
    const believersRef = ref(database, 'believers');
    const unsubscribe = onValue(believersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const believersArray = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        // 절 체크된 불사내용이 있는 신도만 필터링
        const filteredBelievers = believersArray
          .map(believer => {
            // 절 체크된 불사내용만 필터링
            const templeBulsa = (believer.bulsa || []).filter(b => b.isTemple === true);
            if (templeBulsa.length > 0) {
              return { ...believer, bulsa: templeBulsa };
            }
            return null;
          })
          .filter(b => b !== null);
        
        setBelievers(filteredBelievers);
      } else {
        setBelievers([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    if (loginPassword === '1111') {
      setIsLoggedIn(true);
    } else {
      alert('비밀번호가 올바르지 않습니다.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginPassword('');
  };

  const openBulsaPopup = useCallback((believer) => {
    setSelectedBeliever(believer);
    setShowBulsaPopup(true);
  }, []);

  const filteredBelievers = useMemo(() => {
    let result = believers.filter(b => {
      if (!searchTerm) return true;
      const searchParts = searchTerm.trim().split(/\s+/);
      const sizeKeywords = [];
      let textSearchParts = [];
      searchParts.forEach(part => {
        const lowerPart = part.toLowerCase();
        if (lowerPart === '소' || lowerPart === '중' || lowerPart === '대') {
          sizeKeywords.push(part);
        } else {
          textSearchParts.push(part);
        }
      });
      const allTextMatches = textSearchParts.every(searchWord => {
        const lowerSearchWord = searchWord.toLowerCase();
        const nameMatch = (b.name || '').toLowerCase().includes(lowerSearchWord);
        const phoneMatch = (b.phone || '').includes(searchWord);
        const bulsaContentMatch = (b.bulsa || []).some(item => 
          removeServiceText(item.content || '').toLowerCase().includes(lowerSearchWord)
        );
        const bulsaPersonMatch = (b.bulsa || []).some(item => 
          (item.person || '').toLowerCase().includes(lowerSearchWord)
        );
        return nameMatch || phoneMatch || bulsaContentMatch || bulsaPersonMatch;
      });
      if (sizeKeywords.length === 0) {
        return allTextMatches;
      }
      const hasBulsaWithSize = (b.bulsa || []).some(item => sizeKeywords.includes(item.size));
      return allTextMatches && hasBulsaWithSize;
    });

    // 100만원 이상 필터링 적용
    if (showOnlyHighValue) {
      result = result.filter(b => hasHighValueBulsa(b));
    }

    return result;
  }, [believers, searchTerm, showOnlyHighValue]);

  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjUxLCAyMzUsIDAuMSkiLz48L2c+PC9zdmc+')] opacity-30"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-violet-500/5 rounded-full blur-3xl"></div>
        </div>
        <div className="relative bg-gradient-to-br from-purple-50/95 via-indigo-50/95 to-violet-50/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-12 w-full max-w-md border border-purple-200/50">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-3xl"></div>
          <div className="relative text-center mb-10">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl border-4 border-white/50 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-full"></div>
              <span className="text-4xl sm:text-5xl relative z-10">🙏</span>
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-900 via-indigo-800 to-purple-900 bg-clip-text text-transparent mb-2" style={{fontFamily: 'serif'}}>海雲寺</h1>
              <div className="flex items-center justify-center gap-2">
                <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-purple-600 to-transparent"></div>
                <span className="text-purple-800 text-sm font-semibold tracking-wider">절 전용 뷰</span>
                <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-purple-600 to-transparent"></div>
              </div>
              <p className="text-base sm:text-lg text-purple-700 font-medium mt-3">불사 조회 시스템</p>
            </div>
          </div>
          <div className="relative space-y-6">
            <div>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-xl blur opacity-25 group-hover:opacity-40 transition"></div>
                <Lock className="absolute left-4 top-4 w-5 h-5 text-purple-700 z-10" />
                <input 
                  type="password" 
                  value={loginPassword} 
                  onChange={(e) => setLoginPassword(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()} 
                  className="relative w-full pl-12 pr-4 py-4 border-2 border-purple-300/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/80 backdrop-blur-sm text-center text-lg shadow-lg transition-all" 
                  placeholder="••••" 
                />
              </div>
            </div>
            <button 
              onClick={handleLogin} 
              className="relative w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white font-bold py-4 rounded-xl shadow-xl text-lg overflow-hidden group transition-all hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <span className="relative">입장하기</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-50 via-indigo-50 to-violet-50 overflow-y-auto">
      <div className="w-full">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 shadow-xl border-b-4 border-purple-800">
          <div className="max-w-full px-4 sm:px-8 py-4 sm:py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center shadow-lg border-2 sm:border-4 border-purple-200">
                  <span className="text-2xl sm:text-3xl">🙏</span>
                </div>
                <div>
                  <h1 className="text-xl sm:text-4xl font-bold text-white" style={{fontFamily: 'serif'}}>해운사 불사 조회</h1>
                  <p className="text-purple-100 text-xs sm:text-sm mt-1">절 전용 보기</p>
                </div>
              </div>
              <button 
                onClick={handleLogout} 
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold rounded-lg transition-colors shadow-md text-sm sm:text-base"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">로그아웃</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-full px-4 sm:px-8 py-4 sm:py-6">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 border-2 border-purple-200">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 sm:left-4 top-3 sm:top-4 w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                <input 
                  type="text" 
                  placeholder="이름, 전화번호, 불사내용으로 검색..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" 
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-purple-200">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-2xl font-bold text-purple-900">
                신도 목록 ({filteredBelievers.length}명)
              </h2>
              <button
                onClick={() => setShowOnlyHighValue(!showOnlyHighValue)}
                className={`px-4 py-2 rounded-lg font-bold text-sm sm:text-base transition-all shadow-md ${
                  showOnlyHighValue 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' 
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                {showOnlyHighValue ? '💎 고액불사 ON' : '💎 고액불사'}
              </button>
            </div>

            {filteredBelievers.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-purple-700">
                <p className="text-base sm:text-lg">등록된 불사내용이 없습니다.</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-purple-100 to-indigo-100 border-b-2 border-purple-300">
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-purple-900 whitespace-nowrap">이름</th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-purple-900 whitespace-nowrap">전화번호</th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-purple-900 whitespace-nowrap">주소</th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-purple-900 whitespace-nowrap">불사내용</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBelievers.map((believer) => (
                        <tr key={believer.id} className="border-b border-purple-200 hover:bg-purple-50 transition-colors">
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-800 font-medium whitespace-nowrap">
                            {believer.name}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                            {believer.phone}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">
                            <span className="block max-w-[150px] truncate" title={believer.address || ''}>
                              {believer.address ? (
                                believer.address.length > 10 ? 
                                  believer.address.substring(0, 10) + '...' : 
                                  believer.address
                              ) : '-'}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-2 text-xs sm:text-sm whitespace-nowrap">
                            <button 
                              onClick={() => openBulsaPopup(believer)} 
                              className="text-blue-600 hover:text-blue-800 font-semibold underline"
                            >
                              {believer.bulsa && believer.bulsa.length > 0 ? (
                                <div className="flex flex-col items-start leading-tight">
                                  <span className="text-sm font-bold">상세보기</span>
                                  <span className="text-xs text-gray-500">{believer.bulsa.length}건</span>
                                </div>
                              ) : '없음'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 불사내용 팝업 */}
        {showBulsaPopup && selectedBeliever && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-8 w-full max-w-4xl my-4 overflow-y-auto max-h-[95vh]">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-purple-900">{selectedBeliever.name}님 불사내용</h2>
                <button onClick={() => setShowBulsaPopup(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {selectedBeliever.bulsa && selectedBeliever.bulsa.length > 0 && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <h3 className="font-bold text-purple-900 mb-3 text-sm sm:text-base">등록된 불사내용</h3>
                  {selectedBeliever.bulsa.map((b, idx) => (
                    <div key={idx} className="mb-4 pb-4 border-b border-purple-200 last:border-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          {b.size && <span className="text-purple-700 font-bold text-sm sm:text-base">[{b.size}]</span>}
                          <span className="font-semibold text-gray-800 text-sm sm:text-base ml-2">{removeServiceText(b.content)}</span>
                          <span className="text-gray-600 ml-2 sm:ml-4 text-xs sm:text-sm">({b.person})</span>
                          {b.location && <span className="text-gray-600 ml-1 sm:ml-2 text-xs sm:text-sm">위치: {b.location}</span>}
                          {/* 금액은 필터링용으로만 사용, 화면에는 표시 안 함 */}
                        </div>
                      </div>
                      {b.photoURLs && b.photoURLs.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {b.photoURLs.map((photoData, photoIdx) => {
                            const thumbnailUrl = typeof photoData === 'object' ? photoData.thumbnail : photoData;
                            const originalUrl = typeof photoData === 'object' ? photoData.original : photoData;
                            
                            return (
                              <img 
                                key={photoIdx}
                                src={thumbnailUrl} 
                                alt={`불사 사진 ${photoIdx + 1}`}
                                onClick={() => { setViewPhotoUrl(originalUrl); setViewPhotoModal(true); }} 
                                className="w-full h-24 object-cover rounded border-2 border-purple-400 shadow-sm cursor-pointer hover:scale-105 transition-transform"
                                loading="lazy"
                                decoding="async"
                              />
                            );
                          })}
                        </div>
                      )}
                      {b.photoURL && !b.photoURLs && (
                        <div className="mt-2">
                          <img 
                            src={b.photoURL} 
                            alt="불사 사진" 
                            onClick={() => { setViewPhotoUrl(b.photoURL); setViewPhotoModal(true); }} 
                            className="w-32 h-24 object-cover rounded border-2 border-purple-400 shadow-sm cursor-pointer hover:scale-105 transition-transform"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button 
                onClick={() => setShowBulsaPopup(false)} 
                className="w-full px-8 py-3 text-sm sm:text-base bg-gray-300 hover:bg-gray-400 rounded-lg font-bold"
              >
                닫기
              </button>
            </div>
          </div>
        )}

        {/* 사진 크게 보기 모달 */}
        {viewPhotoModal && (
          <div 
            className="fixed inset-0 bg-black z-50 flex items-center justify-center" 
            onClick={() => setViewPhotoModal(false)}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <img 
                src={viewPhotoUrl} 
                alt="불사 사진 확대" 
                className="max-w-full max-h-full object-contain"
                style={{ 
                  width: 'auto',
                  height: 'auto',
                  maxWidth: '100vw',
                  maxHeight: '100vh'
                }}
              />
              <button 
                onClick={(e) => { e.stopPropagation(); setViewPhotoModal(false); }} 
                className="absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100 text-black rounded-full p-3 shadow-2xl transition-all z-10"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm">
                화면을 탭하면 닫힙니다
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
