import type { ESLint, Linter, Rule } from 'eslint';

declare namespace plugin {
  /** 各階層の指定。先頭に `=` を付けると同一階層どうしの import を許可する */
  type LevelOption = string | string[];

  /** モジュール（コンポーネント単位のディレクトリ）の検査モード */
  type ModuleOption = 'strict' | 'loose' | 'off' | false;

  /** `atomic-design/hierarchical-import` のオプション */
  interface HierarchicalImportOptions {
    /** 検査対象から除外するパスの正規表現。既定値は `['node_modules/\\w']` */
    excludes?: string[];
    /** 下位から上位への並び。既定値は `['atoms', 'molecules', '=organisms', 'templates', 'pages']` */
    levels?: LevelOption[];
    /** パスから階層名を取り出す正規表現。指定するとディレクトリ名による推定より優先される */
    pathPatterns?: string[];
    /** モジュールの検査モード。既定値は `'loose'` */
    module?: ModuleOption;
  }

  interface AtomicDesignPlugin extends ESLint.Plugin {
    meta: {
      name: string;
      version: string;
    };
    rules: {
      'hierarchical-import': Rule.RuleModule;
    };
    configs: {
      /** flat config (ESLint 9 / 10) 向けの推奨設定 */
      recommended: Linter.Config;
      /** eslintrc 向けの推奨設定。ESLint 10 では利用できない */
      'recommended-legacy': Linter.LegacyConfig;
    };
  }
}

declare const plugin: plugin.AtomicDesignPlugin;

export = plugin;
