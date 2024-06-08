import {ConnectionGeneratorItem} from "../../types/connection/connection-generator-item";

export abstract class ConnectionStrategy {
    abstract iterator(): IterableIterator<ConnectionGeneratorItem>;

    abstract getConnectionCount(): number;
}