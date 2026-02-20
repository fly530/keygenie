// 多语言支持
const translations = {
  'zh-TW': {
    appTitle: 'KeyGenie',
    appDescription: 'KeyGenie - 安全的密碼生成器',
    // 导航
    navFavorites: '我的最愛',
    navGenerate: '生成密碼',
    navSettings: '設定',
    loginWithGoogle: '使用 Google 登入',
    logout: '登出',

    // 生成密码页面
    pageTitle: 'KeyGenie 密碼精靈',
    pageSubtitle: '用網站名稱或備註，生成高強度密碼。',
    siteNamePlaceholder: '網站名稱',
    accountPlaceholder: '帳號（非必填）',
    masterPasswordPlaceholder: '輸入主密碼',
    generateButton: '生成密碼',
    generating: '生成中...',
    copyButton: '複製',
    // historyTitle: '最近 10 筆歷史記錄', 

    // 我的最爱页面
    favoritesTitle: '我的最愛',
    favoritesSubtitle: '管理並分組密碼，方便快捷。',
    addGroup: '新增群組',
    editGroup: '編輯群組',
    noFavorites: '暫無我的最愛',
    edit: '編輯',
    delete: '刪除',
    changeGroup: '更改群組',
    defaultGroup: '未分組',
    editFavorite: '編輯我的最愛',
    enterGroupName: '請輸入群組名稱',
    selectGroup: '選擇群組',
    save: '保存',

    // 设定页面
    settingsTitle: '設定',
    languageLabel: '語言',
    tutorialTitle: '功能介紹',
    openSourceTitle: '開源專案',
    openSourceLinkText: '在 GitHub 上查看',
    reportIssue: '回報問題',
    reportIssuePlaceholder: '請輸入您遇到的問題或建議...',
    submitReport: '提交',
    dataManagement: '資料管理',
    exportData: '匯出資料',
    importData: '匯入資料',
    clearLocalData: '清除本地數據',
    clearLocalDataConfirm: '確定要清除本地紀錄並從雲端重新同步嗎？此操作無法復原。',
    clearLocalDataSuccess: '已清除本地數據並重新同步完成',
    clearLocalDataFailed: '清除或同步失敗',
    exportSuccess: '資料匯出成功',
    exportFailed: '資料匯出失敗',
    importSuccess: '資料匯入成功',
    importFailed: '資料匯入失敗',
    importConfirm: '匯入資料將覆蓋現有資料，確定要繼續嗎？',
    dataBackupWarning: '⚠️ 重要提醒：清除瀏覽記錄會清空所有資料。建議定期匯出備份或使用雲端同步功能。',
    syncTime: '同步時間',

    // 功能介紹
    tutorialSubtitle: '安全、便捷的密碼生成管理工具',
    passwordGenTitle: '密碼生成功能',
    favoritesTitle2: '我的最愛功能',
    historyTitle2: '歷史記錄功能',
    securityTitle: '重要安全提醒',
    securityWarningTitle: '零知識架構',
    securityWarningContent: '為了保障您的絕對隱私，KeyGenie 採「零知識架構」。我們不會儲存您的主密碼，這意味著：\n唯一性： 只有正確的主密碼能算回您的原始密碼。\n不可復原： 網站名稱+帳號+主密碼，任一輸入不一致，生成的結果將完全不同。\n\n務必妥善保管您的主密碼。',
    whyChooseTitle: '為什麼選擇 KeyGenie？',
    whyChooseItems: {
      ultimateSecurity: {
        title: '極致安全',
        desc: '不同於傳統密碼管理員，KeyGenie 不儲存您的密碼。'
      },
      edgeComputing: {
        title: '端點運算',
        desc: '所有密碼皆在您的裝置上即時計算生成。'
      },
      physicalIsolation: {
        title: '物理隔離',
        desc: '生成的密碼僅在您的裝置上計算，不傳送、不儲存於任何伺服器；僅網站名稱與帳號等標籤可同步至 Supabase。'
      },
      encryption: {
        title: '加密演算法',
        desc: '採用軍規級加密演算法，確保結果唯一且不可逆。'
      },
      uniquePassword: {
        title: '獨立加密',
        desc: '為每個網站自動生成獨特的密碼，確保每一個都足夠安全。'
      }
    },
    coreFeaturesTitle: '核心功能',
    smartPasswordGen: {
      title: '智慧密碼生成',
      consistency: '一致性：相同輸入（網站+主密碼）永遠得到相同結果，無需死記硬背。',
      highStrength: '高強度：自動產生 12-18 位含大小寫、數字及特殊符號的安全密碼。'
    },
    favoritesManagement: {
      title: '收藏與群組管理',
      quickFill: '快速填入：收藏常用網站資訊，點擊即自動載入（僅紀錄標籤，不紀錄密碼）。',
      groupManagement: '分類管理：自定義群組，讓您的帳號清單井然有序。'
    },
    cloudSyncBackup: {
      title: '雲端同步與備份',
      googleBackup: '登入 Google 帳號後，收藏標籤同步至 Supabase，更換裝置也能無縫銜接。'
    },
    historyRecords: {
      title: '歷史紀錄',
      quickAccess: '快速存取：顯示最近 10 筆生成紀錄，支援一鍵轉存至收藏清單。'
    },
    privacyTitle: '關於隱私',
    privacyContent: '您的數據屬於您。我們不儲存您的主密碼與生成的密碼；僅在您主動選擇登入時，將非敏感的「網站標籤與帳號名稱」同步至 Supabase，用於跨裝置同步。完整說明請見下方隱私權政策。',
    privacyPolicyLinkText: '查看完整隱私權政策',
    // 隱私權政策頁面
    privacyPageTitle: '隱私權政策',
    privacyPageLastUpdated: '最後更新',
    privacyIntro: 'KeyGenie（「本服務」）尊重您的隱私。本政策說明我們如何處理您的資料。',
    privacyDataWeCollectTitle: '我們收集的資料',
    privacyDataWeCollect: '本服務在您裝置上本地儲存：網站標籤、帳號名稱、群組與生成紀錄。我們不會儲存您的主密碼或最終生成的密碼；密碼僅在您裝置上以零知識方式計算。',
    privacySyncTitle: '雲端同步',
    privacySync: '若您選擇使用 Google 登入，我們僅將非敏感的「網站標籤與帳號名稱」同步至 Supabase，用於跨裝置同步。主密碼與生成的密碼不會上傳。',
    privacyCookiesTitle: 'Cookie 與類似技術',
    privacyCookies: '本網站可能於必要範圍內使用 Cookie（例如登入狀態）。您可透過瀏覽器設定管理或停用 Cookie。',
    privacyRightsTitle: '您的權利',
    privacyRights: '您有權查詢、更正或刪除您的個人資料。同步資料可透過登出或清除本機資料管理。',
    privacyContactTitle: '聯絡我們',
    privacyContact: '若對本隱私權政策或資料處理有疑問，請透過設定頁的「回報問題」與我們聯絡。',
    usageFlowTitle: '使用流程',
    tutorial: {
      inputInfo: '輸入資訊',
      inputInfoDesc: '網站名稱、帳號（選填）、主密碼',
      passwordLength: '密碼長度',
      passwordLengthDesc: '自動生成 12-18 位安全密碼',
      passwordFeatures: '密碼特點',
      passwordFeaturesDesc: '含大小寫、數字及特殊符號',
      consistency: '一致性',
      consistencyDesc: '相同輸入產生相同密碼',
      security: '安全性',
      securityDesc: '採用軍規級加密演算法',
      groupManagement: '群組管理',
      groupManagementDesc: '建立多個群組分類管理',
      quickGenerate: '快速生成',
      quickGenerateDesc: '點擊卡片自動填入資訊',
      editFeature: '編輯功能',
      editFeatureDesc: '修改名稱、帳號及群組',
      cloudSync: '雲端同步',
      cloudSyncDesc: '登入 Google 自動同步至雲端',
      autoRecord: '自動記錄',
      autoRecordDesc: '生成後自動儲存記錄',
      quickAccess: '快速存取',
      quickAccessDesc: '顯示最近 10 筆記錄',
      favoriteFeature: '加入最愛',
      favoriteFeatureDesc: '將記錄加入最愛清單',
      localStorage: '本機儲存',
      localStorageDesc: '記錄僅存於本機保護隱私',
      masterPasswordWarning: '主密碼無法復原，請妥善保管',
      masterPasswordWarningDesc: '遺忘主密碼將無法產生相同密碼',
      masterPasswordSecurity: '主密碼安全',
      masterPasswordSecurityDesc: '主密碼無法復原，請妥善保管',
      passwordStrength: '密碼強度',
      passwordStrengthDesc: '建議使用複雜主密碼',
      dataSync: '資料同步',
      dataSyncDesc: '登入後同步至 Supabase',
      offlineUse: '離線使用',
      offlineUseDesc: '未登入時資料僅存本機',
      usageStep1: '輸入網站名稱、帳號及主密碼',
      usageStep2: '點擊「生成密碼」產生安全密碼',
      usageStep3: '點擊「複製」複製到剪貼簿',
      usageStep4: '將常用網站加入最愛',
      usageStep5: '登入 Google 自動同步雲端'
    },

    // 通用
    confirm: '確定',
    cancel: '取消',
    cancel: '取消',
    deleting: '刪除中...',
    deleteConfirm: '確定要刪除嗎？',
    deleteHistoryConfirm: '確定要刪除這筆歷史記錄嗎？',
    deleteGroupConfirm: '刪除群組後，該群組下的我的最愛將移到"未分組"。確定要刪除嗎？',
    success: '成功',
    error: '錯誤',
    warning: {
      enterRequired: '請輸入網站名稱和主密碼',
      noPassword: '沒有可複製的密碼',
      enterGroupName: '請輸入群組名稱',
      enterSiteName: '請輸入網站名稱',
      cannotDeleteDefault: '不能刪除默認群組'
    },
    error: {
      generateFailed: '密碼生成發生錯誤',
      deviceIncompatible: '您的設備不支援 WebAssembly，無法使用此功能。請使用支援 WebAssembly 的現代瀏覽器（Chrome 57+、Firefox 52+、Safari 11+、Edge 16+）。',
      copyFailed: '複製失敗'
    },
    success: {
      passwordCopied: '密碼已複製到剪貼簿',
      groupCreated: '群组创建成功',
      groupUpdated: '群組更新成功',
      groupDeleted: '群組刪除成功',
      updated: '更新成功',
      deleted: '刪除成功'
    }
  },
  'zh-CN': {
    appTitle: 'KeyGenie',
    appDescription: 'KeyGenie - 安全的密码生成器',
    // 导航
    navFavorites: '我的最爱',
    navGenerate: '生成密码',
    navSettings: '设置',
    loginWithGoogle: '使用 Google 登录',
    logout: '登出',

    // 生成密码页面
    pageTitle: 'KeyGenie 密码精灵',
    pageSubtitle: '填入网站名称或备注和自己的主密码，即可生成对应的密码。',
    siteNamePlaceholder: '网站名称备注',
    accountPlaceholder: '账号（非必填）',
    masterPasswordPlaceholder: '输入主密码',
    generateButton: '生成密码',
    generating: '生成中...',
    copyButton: '复制',
    historyTitle: '最近 10 条历史记录',

    // 我的最爱页面
    favoritesTitle: '我的最爱',
    favoritesSubtitle: '管理并分组密码，方便快捷',
    addGroup: '新增群组',
    editGroup: '编辑群组',
    noFavorites: '暂无我的最爱',
    edit: '编辑',
    delete: '删除',
    changeGroup: '更改群组',
    defaultGroup: '未分组',
    editFavorite: '编辑我的最爱',
    enterGroupName: '请输入群组名称',
    selectGroup: '选择群组',
    save: '保存',

    // 设定页面
    settingsTitle: '设置',
    languageLabel: '语言',
    tutorialTitle: '功能介绍',
    openSourceTitle: '开源项目',
    openSourceLinkText: '在 GitHub 上查看',
    reportIssue: '反馈问题',
    reportIssuePlaceholder: '请输入您遇到的问题或建议...',
    submitReport: '提交',
    dataManagement: '数据管理',
    exportData: '导出数据',
    importData: '导入数据',
    clearLocalData: '清除本地数据',
    clearLocalDataConfirm: '确定要清除本地记录并从云端重新同步吗？此操作无法复原。',
    clearLocalDataSuccess: '已清除本地数据并重新同步完成',
    clearLocalDataFailed: '清除或同步失败',
    exportSuccess: '数据导出成功',
    exportFailed: '数据导出失败',
    importSuccess: '数据导入成功',
    importFailed: '数据导入失败',
    importConfirm: '导入数据将覆盖现有数据，确定要继续吗？',
    dataBackupWarning: '⚠️ 重要提醒：清除浏览记录会清空所有数据。建议定期导出备份或使用云端同步功能。',
    syncTime: '同步时间',

    // 功能介绍
    tutorialSubtitle: '安全、便捷的密码生成与管理工具',
    passwordGenTitle: '密码生成功能',
    favoritesTitle2: '我的最爱功能',
    historyTitle2: '历史记录功能',
    securityTitle: '重要安全提醒',
    securityWarningTitle: '零知识架构',
    securityWarningContent: '为了保障您的绝对隐私，KeyGenie 采用「零知识架构」。我们不会储存您的主密码，这意味着：\n唯一性： 只有正确的主密码能算回您的原始密码。\n不可复原： 网站名称+账号+主密码，任一输入不一致，生成的结果将完全不同。\n\n务必妥善保管您的主密码。',
    whyChooseTitle: '为什么选择 KeyGenie？',
    whyChooseItems: {
      ultimateSecurity: {
        title: '极致安全',
        desc: '不同于传统密码管理员，KeyGenie 不储存您的密码。'
      },
      edgeComputing: {
        title: '端点运算',
        desc: '所有密码皆在您的装置上即时计算生成。'
      },
      physicalIsolation: {
        title: '物理隔离',
        desc: '生成的密码仅在您的设备上计算，不传送、不储存于任何服务器；仅网站名称与账号等标签可同步至 Supabase。'
      },
      encryption: {
        title: '加密算法',
        desc: '采用军规级加密算法，确保结果唯一且不可逆。'
      },
      uniquePassword: {
        title: '独立加密',
        desc: '为每个网站自动生成独特的密码，确保每一个都足够安全。'
      }
    },
    coreFeaturesTitle: '核心功能',
    smartPasswordGen: {
      title: '智慧密码生成',
      consistency: '一致性：相同输入（网站+主密码）永远得到相同结果，无需死记硬背。',
      highStrength: '高强度：自动产生 12-18 位含大小写、数字及特殊符号的安全密码。'
    },
    favoritesManagement: {
      title: '收藏与群组管理',
      quickFill: '快速填入：收藏常用网站信息，点击即自动载入（仅记录标签，不记录密码）。',
      groupManagement: '分类管理：自定义群组，让您的账号清单井然有序。'
    },
    cloudSyncBackup: {
      title: '云端同步与备份',
      googleBackup: '登录 Google 账号后，收藏标签同步至 Supabase，更换装置也能无缝衔接。'
    },
    historyRecords: {
      title: '历史记录',
      quickAccess: '快速访问：显示最近 10 条生成记录，支持一键转存至收藏清单。'
    },
    privacyTitle: '关于隐私',
    privacyContent: '您的数据属于您。我们不储存您的主密码与生成的密码；仅在您主动选择登录时，将非敏感的「网站标签与账号名称」同步至 Supabase，用于跨设备同步。完整说明请见下方隐私政策。',
    privacyPolicyLinkText: '查看完整隐私政策',
    // 隐私政策页面
    privacyPageTitle: '隐私政策',
    privacyPageLastUpdated: '最后更新',
    privacyIntro: 'KeyGenie（「本服务」）尊重您的隐私。本政策说明我们如何处理您的数据。',
    privacyDataWeCollectTitle: '我们收集的数据',
    privacyDataWeCollect: '本服务在您设备上本地存储：网站标签、账号名称、分组与生成记录。我们不会存储您的主密码或最终生成的密码；密码仅在您设备上以零知识方式计算。',
    privacySyncTitle: '云端同步',
    privacySync: '若您选择使用 Google 登录，我们仅将非敏感的「网站标签与账号名称」同步至 Supabase，用于跨设备同步。主密码与生成的密码不会上传。',
    privacyCookiesTitle: 'Cookie 与类似技术',
    privacyCookies: '本网站可能于必要范围内使用 Cookie（例如登录状态）。您可通过浏览器设置管理或禁用 Cookie。',
    privacyRightsTitle: '您的权利',
    privacyRights: '您有权查询、更正或删除您的个人数据。同步数据可通过登出或清除本地数据管理。',
    privacyContactTitle: '联系我们',
    privacyContact: '若对本隐私政策或数据处理有疑问，请通过设置页的「回报问题」与我们联系。',
    usageFlowTitle: '使用流程',
    tutorial: {
      inputInfo: '输入信息',
      inputInfoDesc: '网站名称、账号（选填）、主密码',
      passwordLength: '密码长度',
      passwordLengthDesc: '自动生成 12-18 位安全密码',
      passwordFeatures: '密码特点',
      passwordFeaturesDesc: '含大小写、数字及特殊符号',
      consistency: '一致性',
      consistencyDesc: '相同输入生成相同密码',
      security: '安全性',
      securityDesc: '采用军规级加密算法',
      groupManagement: '群组管理',
      groupManagementDesc: '创建多个群组分类管理',
      quickGenerate: '快速生成',
      quickGenerateDesc: '点击卡片自动填入信息',
      editFeature: '编辑功能',
      editFeatureDesc: '修改名称、账号及群组',
      cloudSync: '云端同步',
      cloudSyncDesc: '登录 Google 自动同步至云端',
      autoRecord: '自动记录',
      autoRecordDesc: '生成后自动保存记录',
      quickAccess: '快速访问',
      quickAccessDesc: '显示最近 10 条记录',
      favoriteFeature: '添加收藏',
      favoriteFeatureDesc: '将记录添加到收藏夹',
      localStorage: '本地存储',
      localStorageDesc: '记录仅存于本地保护隐私',
      masterPasswordWarning: '主密码无法找回，请妥善保管',
      masterPasswordWarningDesc: '忘记主密码将无法生成相同密码',
      masterPasswordSecurity: '主密码安全',
      masterPasswordSecurityDesc: '主密码无法找回，请妥善保管',
      passwordStrength: '密码强度',
      passwordStrengthDesc: '建议使用复杂主密码',
      dataSync: '数据同步',
      dataSyncDesc: '登录后同步至 Supabase',
      offlineUse: '离线使用',
      offlineUseDesc: '未登录时数据仅存本地',
      usageStep1: '输入网站名称、账号及主密码',
      usageStep2: '点击「生成密码」生成安全密码',
      usageStep3: '点击「复制」复制到剪贴板',
      usageStep4: '将常用网站添加到收藏',
      usageStep5: '登录 Google 自动同步云端'
    },

    // 通用
    confirm: '确定',
    cancel: '取消',
    cancel: '取消',
    deleting: '删除中...',
    deleteConfirm: '确定要删除吗？',
    deleteHistoryConfirm: '确定要删除这条历史记录吗？',
    deleteGroupConfirm: '删除群组后，该群组下的我的最爱将移到"未分组"。确定要删除吗？',
    success: '成功',
    error: '错误',
    warning: {
      enterRequired: '请输入网站名称和主密码',
      noPassword: '没有可复制的密码',
      enterGroupName: '请输入群组名称',
      enterSiteName: '请输入网站名称',
      cannotDeleteDefault: '不能删除默认群组'
    },
    error: {
      generateFailed: '密码生成发生错误',
      deviceIncompatible: '您的设备不支持 WebAssembly，无法使用此功能。请使用支持 WebAssembly 的现代浏览器（Chrome 57+、Firefox 52+、Safari 11+、Edge 16+）。',
      copyFailed: '复制失败'
    },
    success: {
      passwordCopied: '密码已复制到剪贴板',
      groupCreated: '群组创建成功',
      groupUpdated: '群组更新成功',
      groupDeleted: '群组删除成功',
      updated: '更新成功',
      deleted: '删除成功'
    }
  },
  'en': {
    appTitle: 'KeyGenie',
    appDescription: 'KeyGenie - Secure password generator',
    // 导航
    navFavorites: 'Favorites',
    navGenerate: 'Generate',
    navSettings: 'Settings',
    loginWithGoogle: 'Login with Google',
    logout: 'Logout',

    // 生成密码页面
    pageTitle: 'KeyGenie Password Genie',
    pageSubtitle: 'Enter the website name or remark and your master password to generate the corresponding password.',
    siteNamePlaceholder: 'Website Name',
    accountPlaceholder: 'Account (Optional)',
    masterPasswordPlaceholder: 'Enter master password',
    generateButton: 'Generate Password',
    generating: 'Generating...',
    copyButton: 'Copy',
    historyTitle: 'Recent 10 History Records',

    // 我的最爱页面
    favoritesTitle: 'My Favorites',
    favoritesSubtitle: 'Manage and group passwords for convenience',
    addGroup: 'Add Group',
    editGroup: 'Edit Group',
    noFavorites: 'No favorites yet',
    edit: 'Edit',
    delete: 'Delete',
    changeGroup: 'Change Group',
    defaultGroup: 'Uncategorized',
    editFavorite: 'Edit Favorite',
    enterGroupName: 'Please enter group name',
    selectGroup: 'Select Group',
    save: 'Save',

    // 设定页面
    settingsTitle: 'Settings',
    languageLabel: 'Language',
    tutorialTitle: 'Tutorial',
    openSourceTitle: 'Open Source',
    openSourceLinkText: 'View on GitHub',
    reportIssue: 'Report Issue',
    reportIssuePlaceholder: 'Please enter the issue or suggestion...',
    submitReport: 'Submit',
    dataManagement: 'Data Management',
    exportData: 'Export Data',
    importData: 'Import Data',
    clearLocalData: 'Clear Local Data',
    clearLocalDataConfirm: 'Clear all local records and re-sync from cloud? This cannot be undone.',
    clearLocalDataSuccess: 'Local data cleared and re-synced',
    clearLocalDataFailed: 'Clear or sync failed',
    exportSuccess: 'Data exported successfully',
    exportFailed: 'Data export failed',
    importSuccess: 'Data imported successfully',
    importFailed: 'Data import failed',
    importConfirm: 'Importing data will overwrite existing data. Are you sure you want to continue?',
    dataBackupWarning: '⚠️ Important: Clearing browser history will delete all data. Please export backups regularly or use cloud sync.',
    syncTime: 'Sync Time',

    // 功能介绍
    tutorialSubtitle: 'Secure and convenient password generation and management tool',
    passwordGenTitle: 'Password Generation',
    favoritesTitle2: 'Favorites Feature',
    historyTitle2: 'History Feature',
    securityTitle: 'Important Security Reminder',
    securityWarningTitle: 'Zero-Knowledge Architecture',
    securityWarningContent: 'To ensure your absolute privacy, KeyGenie adopts a "Zero-Knowledge Architecture". We do not store your master password, which means:\nUniqueness: Only the correct master password can compute back to your original password.\nIrreversibility: Website name + account + master password, if any input is inconsistent, the generated result will be completely different.\n\nPlease keep your master password safe.',
    whyChooseTitle: 'Why Choose KeyGenie?',
    whyChooseItems: {
      ultimateSecurity: {
        title: 'Ultimate Security',
        desc: 'Unlike traditional password managers, KeyGenie does not store your passwords.'
      },
      edgeComputing: {
        title: 'Edge Computing',
        desc: 'All passwords are computed and generated instantly on your device.'
      },
      physicalIsolation: {
        title: 'Physical Isolation',
        desc: 'Generated passwords are computed only on your device and are never sent or stored on any server; only site names and account labels sync to Supabase.'
      },
      encryption: {
        title: 'Encryption Algorithm',
        desc: 'Uses military-grade encryption algorithm to ensure unique and irreversible results.'
      },
      uniquePassword: {
        title: 'Independent Encryption',
        desc: 'Automatically generates a unique password for each website, ensuring each one is secure enough.'
      }
    },
    coreFeaturesTitle: 'Core Features',
    smartPasswordGen: {
      title: 'Smart Password Generation',
      consistency: 'Consistency: Same input (website + master password) always produces the same result, no need to memorize.',
      highStrength: 'High Strength: Automatically generates 12-18 character secure passwords with uppercase, lowercase, numbers, and special symbols.'
    },
    favoritesManagement: {
      title: 'Favorites & Group Management',
      quickFill: 'Quick Fill: Save frequently used website information, click to auto-load (only records labels, not passwords).',
      groupManagement: 'Category Management: Customize groups to keep your account list organized.'
    },
    cloudSyncBackup: {
      title: 'Cloud Sync & Backup',
      googleBackup: 'Sign in with Google to sync your favorite tags to Supabase, seamlessly switch between devices.'
    },
    historyRecords: {
      title: 'History Records',
      quickAccess: 'Quick Access: Shows the last 10 generation records, supports one-click transfer to favorites.'
    },
    privacyTitle: 'About Privacy',
    privacyContent: 'Your data belongs to you. We do not store your master password or generated passwords; we only sync non-sensitive "website tags and account names" to Supabase when you sign in, for cross-device sync. See the full Privacy Policy below.',
    privacyPolicyLinkText: 'View full Privacy Policy',
    // Privacy Policy page
    privacyPageTitle: 'Privacy Policy',
    privacyPageLastUpdated: 'Last updated',
    privacyIntro: 'KeyGenie ("the Service") respects your privacy. This policy explains how we handle your data.',
    privacyDataWeCollectTitle: 'Data We Collect',
    privacyDataWeCollect: 'The Service stores locally on your device: site labels, account names, groups, and generation history. We do not store your master password or generated passwords; passwords are computed on your device only, in a zero-knowledge manner.',
    privacySyncTitle: 'Cloud Sync',
    privacySync: 'If you sign in with Google, we only sync non-sensitive "site labels and account names" to Supabase for cross-device sync. Your master password and generated passwords are never uploaded.',
    privacyCookiesTitle: 'Cookies and Similar Technologies',
    privacyCookies: 'This site may use cookies where necessary (e.g. sign-in state). You can manage or disable cookies in your browser settings.',
    privacyRightsTitle: 'Your Rights',
    privacyRights: 'You have the right to access, correct, or delete your personal data. Synced data can be managed by signing out or clearing local data.',
    privacyContactTitle: 'Contact Us',
    privacyContact: 'If you have questions about this Privacy Policy or our data practices, please use "Report Issue" on the Settings page to contact us.',
    usageFlowTitle: 'Usage Flow',
    tutorial: {
      inputInfo: 'Input',
      inputInfoDesc: 'Site name, account (optional), master password',
      passwordLength: 'Length',
      passwordLengthDesc: 'Auto-generates 12-18 character passwords',
      passwordFeatures: 'Features',
      passwordFeaturesDesc: 'Includes uppercase, lowercase, numbers & symbols',
      consistency: 'Consistency',
      consistencyDesc: 'Same input = same password',
      security: 'Security',
      securityDesc: 'Military-grade encryption algorithm',
      groupManagement: 'Groups',
      groupManagementDesc: 'Organize favorites into groups',
      quickGenerate: 'Quick Access',
      quickGenerateDesc: 'Tap card to auto-fill',
      editFeature: 'Edit',
      editFeatureDesc: 'Modify name, account & group',
      cloudSync: 'Cloud Sync',
      cloudSyncDesc: 'Auto-sync with Supabase',
      autoRecord: 'Auto-save',
      autoRecordDesc: 'Saves to history automatically',
      quickAccess: 'Quick Access',
      quickAccessDesc: 'Shows recent 10 records',
      favoriteFeature: 'Add Favorite',
      favoriteFeatureDesc: 'Save records to favorites',
      localStorage: 'Local Storage',
      localStorageDesc: 'Records stored locally for privacy',
      masterPasswordWarning: 'Master password cannot be recovered',
      masterPasswordWarningDesc: 'Keep it safe - you cannot reset it',
      masterPasswordSecurity: 'Password Safety',
      masterPasswordSecurityDesc: 'Cannot be recovered - keep it safe',
      passwordStrength: 'Strength',
      passwordStrengthDesc: 'Use a strong master password',
      dataSync: 'Data Sync',
      dataSyncDesc: 'Syncs to Supabase when logged in',
      offlineUse: 'Offline Mode',
      offlineUseDesc: 'Works offline - data stays local',
      usageStep1: 'Enter site name, account & master password',
      usageStep2: 'Tap "Generate Password"',
      usageStep3: 'Tap "Copy" to clipboard',
      usageStep4: 'Add frequently used sites to favorites',
      usageStep5: 'Sign in with Google to sync'
    },

    // 通用
    confirm: 'Confirm',
    cancel: 'Cancel',
    cancel: 'Cancel',
    deleting: 'Deleting...',
    deleteConfirm: 'Are you sure you want to delete?',
    deleteHistoryConfirm: 'Are you sure you want to delete this history record?',
    deleteGroupConfirm: 'After deleting the group, favorites in this group will be moved to "Uncategorized". Are you sure you want to delete?',
    success: 'Success',
    error: 'Error',
    warning: {
      enterRequired: 'Please enter website name and master password',
      noPassword: 'No password to copy',
      enterGroupName: 'Please enter group name',
      enterSiteName: 'Please enter website name',
      cannotDeleteDefault: 'Cannot delete default group'
    },
    error: {
      generateFailed: 'Password generation failed',
      deviceIncompatible: 'Your device does not support WebAssembly and cannot use this feature. Please use a modern browser that supports WebAssembly (Chrome 57+, Firefox 52+, Safari 11+, Edge 16+).',
      copyFailed: 'Copy failed'
    },
    success: {
      passwordCopied: 'Password copied to clipboard',
      groupCreated: 'Group created successfully',
      groupUpdated: 'Group updated successfully',
      groupDeleted: 'Group deleted successfully',
      updated: 'Updated successfully',
      deleted: 'Deleted successfully'
    }
  }
};

// 获取当前语言
export function getCurrentLanguage() {
  const saved = localStorage.getItem('keygenie_language');
  if (saved && translations[saved]) {
    return saved;
  }

  // 自动检测浏览器语言
  const browserLang = navigator.language || navigator.userLanguage;
  if (browserLang.startsWith('zh')) {
    if (browserLang.includes('TW') || browserLang.includes('HK')) {
      return 'zh-TW';
    }
    return 'zh-CN';
  }
  return 'en';
}

// 设置语言
export function setLanguage(lang) {
  if (translations[lang]) {
    localStorage.setItem('keygenie_language', lang);
    return true;
  }
  return false;
}

// 获取翻译
export function t(key) {
  const lang = getCurrentLanguage();
  const keys = key.split('.');
  let value = translations[lang];

  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      return key; // 如果找不到翻译，返回原始 key
    }
  }

  return value || key;
}

// 获取所有可用语言
export function getAvailableLanguages() {
  return [
    { code: 'zh-TW', name: '繁體中文' },
    { code: 'zh-CN', name: '简体中文' },
    { code: 'en', name: 'English' }
  ];
}

export default { t, getCurrentLanguage, setLanguage, getAvailableLanguages };

