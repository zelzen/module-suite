import { OutputType, TransformType } from 'shared/models/options';

export type ProxyOptions = {
  filePath?: string;
  host: string;
  minify?: boolean;
  output?: OutputType;
  transforms?: Array<TransformType>;
};
