import {LayerGeneratorItem} from "../layer/layer-generator-item";

export interface ConnectionGeneratorItem {
    input: LayerGeneratorItem;
    output: LayerGeneratorItem;
    value: number;
    index: number;
}