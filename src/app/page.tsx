/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  // サンプルデータ（実際のサービスではサーバーから取得）
  const allScores = [
    {zaimu3: 12, zaimu4: 5, zaimu5: 14, kanri1: 28, kanri2: 11, sozei2: 18, keiei1: 12, keiei2: 19},
    {zaimu3: 15, zaimu4: 6, zaimu5: 11, kanri1: 35, kanri2: 13, sozei2: 22, keiei1: 14, keiei2: 17},
    {zaimu3: 9, zaimu4: 4, zaimu5: 16, kanri1: 31, kanri2: 9, sozei2: 25, keiei1: 11, keiei2: 21},
    {zaimu3: 16, zaimu4: 7, zaimu5: 13, kanri1: 39, kanri2: 14, sozei2: 19, keiei1: 15, keiei2: 23},
    {zaimu3: 8, zaimu4: 3, zaimu5: 9, kanri1: 22, kanri2: 7, sozei2: 14, keiei1: 8, keiei2: 12},
    {zaimu3: 14, zaimu4: 6, zaimu5: 15, kanri1: 33, kanri2: 12, sozei2: 20, keiei1: 13, keiei2: 18},
    {zaimu3: 11, zaimu4: 4, zaimu5: 12, kanri1: 26, kanri2: 10, sozei2: 16, keiei1: 9, keiei2: 15},
    {zaimu3: 17, zaimu4: 8, zaimu5: 17, kanri1: 41, kanri2: 15, sozei2: 27, keiei1: 16, keiei2: 24},
    {zaimu3: 13, zaimu4: 5, zaimu5: 10, kanri1: 29, kanri2: 8, sozei2: 21, keiei1: 10, keiei2: 16},
    {zaimu3: 10, zaimu4: 7, zaimu5: 18, kanri1: 37, kanri2: 13, sozei2: 23, keiei1: 14, keiei2: 20},
    {zaimu3: 18, zaimu4: 8, zaimu5: 16, kanri1: 42, kanri2: 16, sozei2: 28, keiei1: 17, keiei2: 25},
    {zaimu3: 7, zaimu4: 2, zaimu5: 8, kanri1: 19, kanri2: 6, sozei2: 12, keiei1: 6, keiei2: 10},
    {zaimu3: 14, zaimu4: 6, zaimu5: 13, kanri1: 32, kanri2: 11, sozei2: 19, keiei1: 12, keiei2: 18},
    {zaimu3: 12, zaimu4: 5, zaimu5: 11, kanri1: 27, kanri2: 9, sozei2: 17, keiei1: 11, keiei2: 14},
    {zaimu3: 16, zaimu4: 7, zaimu5: 15, kanri1: 38, kanri2: 14, sozei2: 24, keiei1: 15, keiei2: 22}
  ];

  // 問題設定
  const questionConfig = {
    'zaimu3': { name: '財務会計論 第3問', maxScore: 18, unit: '個', subject: '財務会計論', colorClass: 'border-l-red-500' },
    'zaimu4': { name: '財務会計論 第4問', maxScore: 8, unit: '個', subject: '財務会計論', colorClass: 'border-l-red-500' },
    'zaimu5': { name: '財務会計論 第5問', maxScore: 18, unit: '個', subject: '財務会計論', colorClass: 'border-l-red-500' },
    'kanri1': { name: '管理会計論 第1問', maxScore: 43, unit: '点', subject: '管理会計論', colorClass: 'border-l-orange-500' },
    'kanri2': { name: '管理会計論 第2問', maxScore: 16, unit: '点', subject: '管理会計論', colorClass: 'border-l-orange-500' },
    'sozei2': { name: '租税法 第2問', maxScore: 30, unit: '個', subject: '租税法', colorClass: 'border-l-purple-500' },
    'keiei1': { name: '経営学 第1問', maxScore: 17, unit: '個', subject: '経営学', colorClass: 'border-l-green-500' },
    'keiei2': { name: '経営学 第2問', maxScore: 25, unit: '個', subject: '経営学', colorClass: 'border-l-green-500' }
  };

  const [userScores, setUserScores] = useState<Record<string, string>>({});
  const [results, setResults] = useState<any>(null);
  const [currentMode, setCurrentMode] = useState<'input' | 'stats'>('input');
  const [userCode, setUserCode] = useState<string>('');
  const [showCodeInput, setShowCodeInput] = useState<boolean>(false);
  const [hasCalculated, setHasCalculated] = useState<boolean>(false);

  // 8桁コード生成
  const generateUserCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // データ類似度チェック（重複除去用）
  const calculateSimilarity = (data1: any, data2: any) => {
    const keys = Object.keys(questionConfig);
    let matchCount = 0;
    let totalCompared = 0;
    
    keys.forEach(key => {
      const val1 = data1[key];
      const val2 = data2[key];
      // 両方のデータで入力されている科目のみを比較対象とする
      if (val1 !== undefined && val1 !== null && val1 !== '' && 
          val2 !== undefined && val2 !== null && val2 !== '') {
        totalCompared++;
        if (Math.abs(parseFloat(val1) - parseFloat(val2)) <= 1) { // 1点以内の差は類似とみなす
          matchCount++;
        }
      }
    });
    
    // 比較可能な科目が3つ以上ある場合のみ類似度判定を行う
    return totalCompared >= 3 ? matchCount / totalCompared : 0;
  };

  // 重複データフィルタリング
  const filterDuplicateData = (scores: any[], newUserData: any) => {
    return scores.filter(score => {
      const similarity = calculateSimilarity(score, newUserData);
      return similarity < 0.8; // 80%以上類似は除外
    });
  };

  // データ保存（実際のサービスではサーバーに送信）
  const saveToCloud = (code: string, data: any) => {
    // 実装時はここでSupabaseなどに保存
    console.log('Saving to cloud:', { code, data });
  };

  // データ読み込み（実際のサービスではサーバーから取得）
  const loadFromCloud = async (code: string) => {
    // 実装時はここでSupabaseなどから取得
    console.log('Loading from cloud:', code);
    return null;
  };

  const validateInput = (key: string, value: string) => {
    const numValue = parseInt(value);
    const config = questionConfig[key as keyof typeof questionConfig];
    if (!isNaN(numValue)) {
      if (numValue > config.maxScore) {
        return config.maxScore.toString();
      } else if (numValue < 0) {
        return '0';
      }
    }
    return value;
  };

  const handleInputChange = (key: string, value: string) => {
    const validatedValue = validateInput(key, value);
    setUserScores(prev => ({
      ...prev,
      [key]: validatedValue
    }));
  };

  const calculateAverage = (scores: any[], question: string) => {
    const validScores = scores.filter(s => s[question] !== undefined && s[question] !== null && s[question] !== '');
    return validScores.length > 0 ? validScores.reduce((sum, s) => sum + parseFloat(s[question]), 0) / validScores.length : 0;
  };

  const calculateStandardDeviation = (scores: any[], question: string, average: number) => {
    const validScores = scores.filter(s => s[question] !== undefined && s[question] !== null && s[question] !== '');
    if (validScores.length <= 1) return 1;
    const variance = validScores.reduce((sum, s) => sum + Math.pow(parseFloat(s[question]) - average, 2), 0) / validScores.length;
    return Math.sqrt(variance);
  };

  const calculateDeviation = (score: number, average: number, stdDev: number) => {
    return 50 + (score - average) / stdDev * 10;
  };

  const getScore52Level = (average: number, stdDev: number) => {
    return average + stdDev * 0.2;
  };

  const calculateResults = () => {
    const userScore: Record<string, number> = {};
    const inputtedSubjects = new Set<string>();

    // 入力されたデータのみを取得
    Object.keys(questionConfig).forEach(key => {
      const value = parseFloat(userScores[key] || '');
      if (!isNaN(value)) {
        userScore[key] = value;
        const config = questionConfig[key as keyof typeof questionConfig];
        inputtedSubjects.add(config.subject);
      }
    });

    // 少なくとも1つの科目が入力されているかチェック
    if (Object.keys(userScore).length === 0) {
      alert('少なくとも1つの科目の点数を入力してください。');
      return;
    }

    // 異常値フィルタリング用関数
    const filterAbnormalScores = (scores: any[], key: string) => {
      const config = questionConfig[key as keyof typeof questionConfig];
      return scores.filter(s => {
        const score = s[key];
        if (score === undefined || score === null || score === '') return true;
        const numScore = parseFloat(score);
        // 満点や0点の連続入力を除外
        return !(numScore === 0 || numScore === config.maxScore);
      });
    };

    // 重複データを除外したallScoresを作成
    const filteredAllScores = filterDuplicateData(allScores, userScore);
    const allData = [...filteredAllScores, userScore];
    const calculatedResults: any = {};
    const subjectResults: any = {};

    // 各大問の偏差値を計算
    Object.keys(userScore).forEach(key => {
      const config = questionConfig[key as keyof typeof questionConfig];
      const filteredData = filterAbnormalScores(allData, key);
      const average = calculateAverage(filteredData, key);
      const stdDev = calculateStandardDeviation(filteredData, key, average);
      const userDeviation = calculateDeviation(userScore[key], average, stdDev);
      const score52Level = getScore52Level(average, stdDev);

      calculatedResults[key] = {
        config,
        userScore: userScore[key],
        average,
        deviation: userDeviation,
        score52Level
      };
    });

    // 科目ごとの偏差値を計算
    if (userScore.zaimu3 !== undefined || userScore.zaimu4 !== undefined || userScore.zaimu5 !== undefined) {
      const zaimuDeviations = [];
      if (userScore.zaimu3 !== undefined) zaimuDeviations.push(calculatedResults.zaimu3.deviation * 0.6);
      if (userScore.zaimu4 !== undefined) zaimuDeviations.push(calculatedResults.zaimu4.deviation * 0.7);
      if (userScore.zaimu5 !== undefined) zaimuDeviations.push(calculatedResults.zaimu5.deviation * 0.7);
      subjectResults.zaimu = zaimuDeviations.reduce((a, b) => a + b, 0) / 2;
    }

    if (userScore.kanri1 !== undefined || userScore.kanri2 !== undefined) {
      const kanriDeviations = [];
      if (userScore.kanri1 !== undefined) kanriDeviations.push(calculatedResults.kanri1.deviation);
      if (userScore.kanri2 !== undefined) kanriDeviations.push(calculatedResults.kanri2.deviation);
      subjectResults.kanri = kanriDeviations.reduce((a, b) => a + b, 0) / kanriDeviations.length;
    }

    if (userScore.sozei2 !== undefined) {
      subjectResults.sozei = calculatedResults.sozei2.deviation;
    }

    if (userScore.keiei1 !== undefined || userScore.keiei2 !== undefined) {
      const keieiDeviations = [];
      if (userScore.keiei1 !== undefined) keieiDeviations.push(calculatedResults.keiei1.deviation);
      if (userScore.keiei2 !== undefined) keieiDeviations.push(calculatedResults.keiei2.deviation);
      subjectResults.keiei = keieiDeviations.reduce((a, b) => a + b, 0) / keieiDeviations.length;
    }

    // 総合偏差値を計算
    let totalDeviation = 0;
    let subjectCount = 0;
    
    if (subjectResults.zaimu !== undefined) {
      totalDeviation += subjectResults.zaimu * 2;
      subjectCount += 2;
    }
    if (subjectResults.kanri !== undefined) {
      totalDeviation += subjectResults.kanri;
      subjectCount += 1;
    }
    if (subjectResults.sozei !== undefined) {
      totalDeviation += subjectResults.sozei;
      subjectCount += 1;
    }
    if (subjectResults.keiei !== undefined) {
      totalDeviation += subjectResults.keiei;
      subjectCount += 1;
    }

    const overallDeviation = totalDeviation / subjectCount;

    setResults({
      questionResults: calculatedResults,
      subjectResults,
      overallDeviation,
      inputtedSubjects: Array.from(inputtedSubjects)
    });

    // 分析結果表示後にコードを生成（初回のみ）
    if (!userCode) {
      const newCode = generateUserCode();
      setUserCode(newCode);
    }

    // 計算済みフラグを設定
    setHasCalculated(true);
  };

  const clearData = () => {
    if (confirm('入力したデータをクリアしますか？')) {
      setUserScores({});
      setResults(null);
      setHasCalculated(false);
    }
  };

  const generateStats = () => {
    return Object.keys(questionConfig).map(key => {
      const config = questionConfig[key as keyof typeof questionConfig];
      const average = calculateAverage(allScores, key);
      const stdDev = calculateStandardDeviation(allScores, key, average);
      const score52Level = getScore52Level(average, stdDev);
      const dataCount = allScores.filter(s => s[key] !== undefined).length;

      return {
        key,
        config,
        average,
        score52Level,
        dataCount
      };
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-purple-800">
      <div className="container mx-auto max-w-4xl p-5">
        {/* ヘッダーカード */}
        <div className="bg-white rounded-2xl shadow-2xl mb-5 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white p-5 text-center">
            <h1 className="text-3xl font-bold mb-2">
              令和７年度会計士論文式試験<br />
              偏差値カリキュレーター
            </h1>
          </div>
        </div>

        {/* 注意書き */}
        <div className="text-center mb-5">
          <p className="text-white text-sm mb-4">
            ※入力者の中での偏差値が算出されるため、実際の本試験結果とは異なる可能性が多分にあります
          </p>
        </div>

        {/* 既存データ復元機能（ページ上部） */}
        <div className="bg-white rounded-xl shadow-lg mb-5 p-4">
          <div className="text-center">
            <div className="text-sm text-gray-700 mb-3">
              <strong>以前に成績を入力したときのコードをお持ちの方</strong>
            </div>
            {!showCodeInput ? (
              <button
                onClick={() => setShowCodeInput(true)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
              >
                前回の成績表を復元
              </button>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="text-sm text-gray-600">コードを入力して前回の成績表を復元してください:</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="8桁コードを入力"
                    maxLength={8}
                    className="p-2 border-2 border-gray-300 rounded-lg uppercase text-center"
                    onChange={(e) => {
                      const code = e.target.value.toUpperCase();
                      if (code.length === 8) {
                        setUserCode(code);
                        setShowCodeInput(false);
                        // 実際のサービスではここでデータをロード
                        // 復元後は編集可能状態にする
                        setResults(null);
                        alert(`コード ${code} で成績表を復元しました（デモ版では機能しません）`);
                      }
                    }}
                  />
                  <button
                    onClick={() => setShowCodeInput(false)}
                    className="px-3 py-2 bg-gray-400 text-white rounded-lg text-sm"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* モード切り替えボタン */}
        <div className="text-center mb-5">
          <button
            onClick={() => setCurrentMode('input')}
            className={`mx-2 px-6 py-3 rounded-full text-white font-semibold transition-all ${
              currentMode === 'input'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 transform -translate-y-1 shadow-lg'
                : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-blue-600 hover:to-purple-600'
            }`}
          >
            成績を入力する
          </button>
          <button
            onClick={() => setCurrentMode('stats')}
            className={`mx-2 px-6 py-3 rounded-full text-white font-semibold transition-all ${
              currentMode === 'stats'
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 transform -translate-y-1 shadow-lg'
                : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-yellow-500 hover:to-orange-500'
            }`}
          >
            統計のみ確認
          </button>
        </div>

        {/* 入力セクション */}
        {currentMode === 'input' && (
          <div className="bg-white rounded-2xl shadow-2xl mb-5">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-blue-600 border-b-2 border-blue-600 pb-3 mb-6">
                成績入力
              </h2>
              <p className="text-gray-600 mb-6">
                客観採点可能部分のスコアのみを入力してください。記述部分は含みません
              </p>

              {/* 財務会計論 */}
              <div className="mb-8 p-4 bg-gray-50 rounded-xl">
                <div className="text-xl font-bold mb-4 text-gray-800">財務会計論</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['zaimu3', 'zaimu4', 'zaimu5'].map((key) => {
                    const config = questionConfig[key as keyof typeof questionConfig];
                    return (
                      <div key={key} className="flex flex-col max-w-xs">
                        <label className="font-semibold mb-1 text-gray-600 text-sm">
                          {key === 'zaimu3' ? '第3問' : key === 'zaimu4' ? '第4問' : '第5問'}
                        </label>
                        <input
                          type="number"
                          value={userScores[key] || ''}
                          onChange={(e) => handleInputChange(key, e.target.value)}
                          min="0"
                          max={config.maxScore}
                          placeholder="正答数を入力"
                          className="p-3 border-2 border-gray-300 rounded-lg text-base focus:outline-none focus:border-blue-500 transition-colors"
                        />
                        <div className="text-xs text-gray-600 mt-1">
                          全{config.maxScore}個
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 管理会計論 */}
              <div className="mb-8 p-4 bg-gray-50 rounded-xl">
                <div className="text-xl font-bold mb-1 text-gray-800">管理会計論</div>
                <div className="text-xs text-gray-600 mb-4">※管理会計論は池邉講師が予想している配点に基づく</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['kanri1', 'kanri2'].map((key) => {
                    const config = questionConfig[key as keyof typeof questionConfig];
                    return (
                      <div key={key} className="flex flex-col max-w-xs">
                        <label className="font-semibold mb-1 text-gray-600 text-sm">
                          {key === 'kanri1' ? '第1問' : '第2問'}
                        </label>
                        <input
                          type="number"
                          value={userScores[key] || ''}
                          onChange={(e) => handleInputChange(key, e.target.value)}
                          min="0"
                          max={config.maxScore}
                          placeholder="点数を入力"
                          className="p-3 border-2 border-gray-300 rounded-lg text-base focus:outline-none focus:border-blue-500 transition-colors"
                        />
                        <div className="text-xs text-gray-600 mt-1">
                          {config.maxScore}点満点
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 租税法 */}
              <div className="mb-8 p-4 bg-gray-50 rounded-xl">
                <div className="text-xl font-bold mb-4 text-gray-800">租税法</div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex flex-col max-w-xs">
                    <label className="font-semibold mb-1 text-gray-600 text-sm">第2問</label>
                    <input
                      type="number"
                      value={userScores.sozei2 || ''}
                      onChange={(e) => handleInputChange('sozei2', e.target.value)}
                      min="0"
                      max={30}
                      placeholder="正答数を入力"
                      className="p-3 border-2 border-gray-300 rounded-lg text-base focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <div className="text-xs text-gray-600 mt-1">全30個</div>
                  </div>
                </div>
              </div>

              {/* 経営学 */}
              <div className="mb-8 p-4 bg-gray-50 rounded-xl">
                <div className="text-xl font-bold mb-4 text-gray-800">経営学</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['keiei1', 'keiei2'].map((key) => {
                    const config = questionConfig[key as keyof typeof questionConfig];
                    return (
                      <div key={key} className="flex flex-col max-w-xs">
                        <label className="font-semibold mb-1 text-gray-600 text-sm">
                          {key === 'keiei1' ? '第1問' : '第2問'}
                        </label>
                        <input
                          type="number"
                          value={userScores[key] || ''}
                          onChange={(e) => handleInputChange(key, e.target.value)}
                          min="0"
                          max={config.maxScore}
                          placeholder="正答数を入力"
                          className="p-3 border-2 border-gray-300 rounded-lg text-base focus:outline-none focus:border-blue-500 transition-colors"
                        />
                        <div className="text-xs text-gray-600 mt-1">
                          全{config.maxScore}個
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ボタン */}
              <div className="text-center">
                <button
                  onClick={calculateResults}
                  className="mx-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold text-lg hover:transform hover:-translate-y-1 hover:shadow-lg transition-all"
                >
                  {hasCalculated ? '修正した入力内容を反映' : '分析結果を表示'}
                </button>
                <button
                  onClick={clearData}
                  className="mx-2 px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full font-semibold text-lg hover:transform hover:-translate-y-1 hover:shadow-lg transition-all"
                >
                  データをクリア
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 結果セクション */}
        {results && currentMode === 'input' && (
          <div className="bg-white rounded-2xl shadow-2xl mb-5">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-blue-600 border-b-2 border-blue-600 pb-3 mb-6">
                あなたの分析結果
              </h2>

              {/* 分析結果表示後のコード表示（結果のすぐ下に配置） */}
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-6">
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-800 mb-2">
                    他のデバイスでも確認・編集するには
                  </div>
                  <div className="text-sm text-gray-700 mb-3">
                    以下のコードをメモ・スクショして保存してください
                  </div>
                  <div className="text-2xl font-bold text-blue-600 bg-white p-3 rounded-lg inline-block border-2 border-gray-200">
                    {userCode}
                  </div>
                  <div className="text-xs text-gray-600 mt-3">
                    スマホ・PC・タブレットなど、どのデバイスからでも<br/>
                    ページ上部の「前回の成績表を復元」からこのコードで同じ結果を確認できます
                  </div>
                </div>
              </div>
              
              {/* 各大問の結果を科目ごとにグループ化 */}
              {results.inputtedSubjects.map((subject: string) => {
                const subjectQuestions = Object.keys(results.questionResults).filter(
                  key => results.questionResults[key].config.subject === subject
                );
                
                return (
                  <div key={subject} className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">{subject}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      {subjectQuestions.map((key) => {
                        const result = results.questionResults[key];
                        return (
                          <div
                            key={key}
                            className={`bg-gray-50 p-4 rounded-xl border-l-4 ${result.config.colorClass}`}
                          >
                            <h4 className="font-bold text-lg mb-2">{result.config.name}</h4>
                            <div className="text-xl font-bold text-blue-600 my-2">
                              偏差値: {result.deviation.toFixed(1)}
                            </div>
                            <div className="mb-2">
                              あなたの{result.config.unit === '点' ? '得点' : '正答数'}: 
                              <strong className="ml-1">{result.userScore}{result.config.unit}</strong>
                            </div>
                            <div className="text-sm text-gray-600">
                              平均{result.config.unit === '点' ? '点' : '正答数'}: {result.average.toFixed(1)}{result.config.unit}
                            </div>
                            <div className="text-sm text-gray-600">
                              偏差値52レベル: {result.score52Level.toFixed(1)}{result.config.unit}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* 科目ごとの偏差値 */}
                    {subject === '財務会計論' && results.subjectResults.zaimu !== undefined && (
                      <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-2">
                        <div className="text-lg font-bold text-red-800">
                          財務会計論 科目偏差値: {results.subjectResults.zaimu.toFixed(1)}
                        </div>
                      </div>
                    )}
                    {subject === '管理会計論' && results.subjectResults.kanri !== undefined && (
                      <div className="bg-orange-100 border border-orange-300 rounded-lg p-4 mb-2">
                        <div className="text-lg font-bold text-orange-800">
                          管理会計論 科目偏差値: {results.subjectResults.kanri.toFixed(1)}
                        </div>
                      </div>
                    )}
                    {subject === '租税法' && results.subjectResults.sozei !== undefined && (
                      <div className="bg-purple-100 border border-purple-300 rounded-lg p-4 mb-2">
                        <div className="text-lg font-bold text-purple-800">
                          租税法 科目偏差値: {results.subjectResults.sozei.toFixed(1)}
                        </div>
                      </div>
                    )}
                    {subject === '経営学' && results.subjectResults.keiei !== undefined && (
                      <div className="bg-green-100 border border-green-300 rounded-lg p-4 mb-2">
                        <div className="text-lg font-bold text-green-800">
                          経営学 科目偏差値: {results.subjectResults.keiei.toFixed(1)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* 総合偏差値 */}
              <div className="bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-300 rounded-lg p-6 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-800 mb-2">総合偏差値</div>
                  <div className="text-4xl font-bold text-purple-600">
                    {results.overallDeviation.toFixed(1)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 統計セクション */}
        <div className="bg-white rounded-2xl shadow-2xl">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-blue-600 border-b-2 border-blue-600 pb-3 mb-6">
              全体統計
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-500 text-white">
                    <th className="p-3 text-center font-bold border-b border-gray-300">科目・問題</th>
                    <th className="p-3 text-center font-bold border-b border-gray-300">平均</th>
                    <th className="p-3 text-center font-bold border-b border-gray-300">偏差値52レベル</th>
                    <th className="p-3 text-center font-bold border-b border-gray-300">データ数</th>
                  </tr>
                </thead>
                <tbody>
                  {generateStats().map((stat, index) => (
                    <tr key={stat.key} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="p-3 text-center border-b border-gray-200">{stat.config.name}</td>
                      <td className="p-3 text-center border-b border-gray-200">
                        {stat.average.toFixed(1)}{stat.config.unit}
                      </td>
                      <td className="p-3 text-center border-b border-gray-200">
                        {stat.score52Level.toFixed(1)}{stat.config.unit}
                      </td>
                      <td className="p-3 text-center border-b border-gray-200">{stat.dataCount}人</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded">
              ※ このデモでは固定のサンプルデータを使用しています
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}