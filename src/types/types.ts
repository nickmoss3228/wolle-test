export interface Article {
    title: string;
    abstract: string;
    published_date: string;
    url: string;
    updated_date: string;
    created_date: string;
    multimedia: MultimediaItem[] | null;
    section: string;
}   

export interface MultimediaItem {
    url: string;
    format: string;
    height: number;
    width: number;
    type: string;
}

export interface ApiResponse {
    status: string;
    copyright: string;
    section: string;
    last_updated: string;
    num_results: number;
    results: Article[];
}
