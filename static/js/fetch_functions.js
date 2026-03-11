
export async function get_jobs(page) {
    const response = await fetch(`/jobs?page=${page}`);

    if (!response.ok) {
        throw new Error("Error fetching data");
    }

    const data = await response.json();

    return data.data;
    
}