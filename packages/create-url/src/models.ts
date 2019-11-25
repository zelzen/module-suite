import { OutputType, TransformType } from 'shared/models/options';

export type ProxyOptions = {
  filePath?: string;
  host: string;
  minify?: boolean;
  output?: OutputType;
  /** Which transforms to perform. Set to false to disable all transforms */
  transforms?: Array<TransformType> | false;
};
