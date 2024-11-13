export class Model extends String {
    id: string;
    url?: string;

    constructor(id: string, url?: string) {
        super(id);
        this.id = id;
        this.url = url;
    }
}
