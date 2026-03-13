
export async function get_jobs(page) {
    const response = await fetch(`/jobs?page=${page}`);

    if (!response.ok) {
        throw new Error("Error fetching data");
    }

    const data = await response.json();

    return data.data;
    
}

export async function get_job_evaluation(id) {
    const response = await fetch(`/job_eval?id=${id}`);

    if (!response.ok) {
        throw new Error("Error fetching data");
    }

    const data = await response.json();

    return data
}

export async function get_market_analysis() {
    const response = await fetch("/market_analysis");

    if (!response.ok) {
        throw new Error("Error fetching data");
    }

    const data = await response.json();

    return data;

}

export async function fetch_job_recommendations(data) {
    const response = await fetch(`/job_recommendation`,
        {
            method:"POST",
            headers: {
                "Content-Type": "application/json"
            },
            body:JSON.stringify(data)

        }
    );

    if (!response.ok) {
        throw new Error("Error fetching data");
    }

    const response_data = await response.json();

    return response_data;
}

export async function search_jobs(q){
    const response = await fetch(`/search?q=${encodeURIComponent(q)}`)

    if (!response.ok) {
        throw new Error("Error fetching data");
    }

    const response_data = await response.json();

    return response_data;

}