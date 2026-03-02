

export interface GetAllProvincesResponse {
    message: string;
    data: Province[];
}

export interface GetAllMunicipalitiesByProvinceIdResponse {
    message: string;
    data: Municipality[];
}

export interface Province {
    id: number;
    name: string;
    code: string;
}

export interface Municipality {
    id: number;
    name: string;
    provinceId: string;
}