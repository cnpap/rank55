/**
 * 装备特效提取器
 */
export class ItemEffectExtractor {
  /**
   * 提取装备特效
   */
  extractPassiveEffects(description: string): string[] {
    const effects: string[] = [];
    const effectMap = new Map<string, string>();

    if (!description) {
      return effects;
    }

    // 解码HTML实体
    const decodedDesc = this.decodeHTMLEntities(description);

    // 提取所有 <passive> 和 <active> 标签的内容
    const pattern =
      /<(passive|active)>([^<]+)<\/\1>([\s\S]*?)(?=<(?:passive|active)>|<\/mainText>|$)/g;
    const matches = Array.from(decodedDesc.matchAll(pattern));

    for (const match of matches) {
      if (match.length >= 4) {
        const type = match[1]; // passive or active
        const name = match[2].trim();
        let desc = match[3].trim();

        // 清理描述
        desc = this.cleanEffectDescription(desc);

        // 构建特效键（类型 + 名称）
        const key = `${type}:${name}`;

        // 如果该特效已存在，合并描述
        if (effectMap.has(key)) {
          const existingDesc = effectMap.get(key)!;
          effectMap.set(key, `${existingDesc} ${desc}`);
        } else {
          effectMap.set(key, desc);
        }
      }
    }

    // 将 Map 转换为特效列表
    effectMap.forEach((desc, key) => {
      const [type, name] = key.split(':');
      const prefix = type === 'active' ? '主动' : '被动';
      effects.push(`${prefix}: ${name} - ${desc}`);
    });

    return effects;
  }

  /**
   * 解码HTML实体
   */
  private decodeHTMLEntities(description: string): string {
    let decodedDesc = description.replace(/\\u003c/g, '<');
    decodedDesc = decodedDesc.replace(/\\u003e/g, '>');
    return decodedDesc;
  }

  /**
   * 清理特效描述
   */
  private cleanEffectDescription(desc: string): string {
    desc = desc.replace(/<br\s*\/?>/g, ' '); // 将换行替换为空格
    desc = desc.replace(/<[^>]*>/g, ''); // 移除所有HTML标签
    desc = desc.replace(/\s+/g, ' '); // 合并多余空格
    desc = desc.trim();
    return desc;
  }
}
