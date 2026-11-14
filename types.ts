export enum CategoryType {
  ANIMATION = 'Animation',
  RADIO = 'Radio',
  CONCERT = 'Concert',
  MUSIC = 'Music',
  STAGE = 'Stage',
  ACTIVITY = 'Activity'
}

export interface VideoLink {
  id: string;
  title: string;
  url: string;
  bvid?: string;
  category: CategoryType;
  subCategory?: string;
  /** 第三级标签分类（如出演声优、舞台剧演员、企划/嘉宾等） */
  tags?: string[];
  addedAt: string;
  dateAdded?: number;
}

export interface CategoryConfig {
  id: CategoryType;
  label: string;
  description: string;
  color: string;
  iconName: string;
}

export interface SiteStats {
  totalViews: number;
  totalClicks: number;
  categoryViews: Record<string, number>;
  categoryClicks: Record<string, number>;
  videoClicks: Record<string, number>;
  tagClicks: Record<string, number>;
  lastUpdated: string;
}

// 依据上传的 821 条真实数据整理的二级子分类
export const DEFAULT_SUB_CATEGORIES: Record<CategoryType, string[]> = {
  [CategoryType.ANIMATION]: ['正片', '剧场版', 'PV', '动画宣传', '联动广告'],
  [CategoryType.RADIO]: ['全熟', '切片'],
  [CategoryType.MUSIC]: ['MV', 'The first take', 'music', '翻唱与演奏'],
  [CategoryType.CONCERT]: ['整场', '单曲', '片段', '花絮'],
  [CategoryType.STAGE]: ['正片', '花絮', '宣传视频', '其他'],
  [CategoryType.ACTIVITY]: ['直播', '节目', '线下活动', '访谈', '吉他英雄之路', '切片', '其他官方消息']
};

// 第三级标签预设分组（出演声优 / 舞台剧演员 / 其他嘉宾）
export const DEFAULT_TAG_GROUPS: { group: string; tags: string[] }[] = [
  {
    group: '结束乐队声优',
    tags: ['青山吉能', '铃代纱弓', '水野朔', '长谷川育美']
  },
  {
    group: '舞台剧演员',
    tags: ['守乃まも', '大竹美希', '小山内花凛', '大森未来衣', '河内美里', '月川玲', '冈菜菜美', '津久井有咲']
  },
  {
    group: '其他声优与嘉宾',
    tags: ['内田真礼', '千本木彩花', '小岩井小鸟', '间岛淳司', '音羽-otoha-', '木谷龙也', '滨路晶']
  }
];

export const ALL_PRESET_TAGS: string[] = DEFAULT_TAG_GROUPS.flatMap(g => g.tags);