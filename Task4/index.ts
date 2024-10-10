import axios from 'axios';

const inputUrl = 'https://test-share.shub.edu.vn/api/intern-test/input';
const outputUrl = 'https://test-share.shub.edu.vn/api/intern-test/output';

async function fetchData() {
    const response = await axios.get(inputUrl);
    return response.data;
}

async function sendOutput(token: string, results: number[]) {
    await axios.post(outputUrl, results, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
}

function processQueries(data: number[], queries: { type: string; range: number[] }[]) {
    const results: number[] = [];

    // Tính tổng tiền tố cho loại 1
    const prefixSum = new Array(data.length + 1).fill(0);
    for (let i = 0; i < data.length; i++) {
        prefixSum[i + 1] = prefixSum[i] + data[i];
    }

    // Tính tổng các phần tử ở vị trí chẵn và lẻ
    const evenSum = new Array(data.length).fill(0);
    const oddSum = new Array(data.length).fill(0);
    for (let i = 0; i < data.length; i++) {
        evenSum[i] = (i % 2 === 0 ? data[i] : 0);
        oddSum[i] = (i % 2 !== 0 ? data[i] : 0);
    }

    // Tính tổng tiền tố cho các tổng chẵn và lẻ
    const evenPrefixSum = new Array(data.length + 1).fill(0);
    const oddPrefixSum = new Array(data.length + 1).fill(0);
    for (let i = 0; i < data.length; i++) {
        evenPrefixSum[i + 1] = evenPrefixSum[i] + evenSum[i];
        oddPrefixSum[i + 1] = oddPrefixSum[i] + oddSum[i];
    }

    // Xử lý từng truy vấn
    for (const query of queries) {
        const { type, range } = query;
        const [l, r] = range;

        console.log(`Processing query: type=${type}, range=[${l}, ${r}]`); // Log query

        if (type === "1") {
            // Tính tổng trong khoảng [l, r]
            const sum = prefixSum[r + 1] - prefixSum[l];
            console.log(`Sum from ${l} to ${r} is ${sum}`); // Log result for type 1
            results.push(sum);
        } else if (type === "2") {
            // Tính tổng các phần tử ở vị trí chẵn và trừ đi tổng các phần tử ở vị trí lẻ
            const alternatingSum = evenPrefixSum[r + 1] - evenPrefixSum[l] - (oddPrefixSum[r + 1] - oddPrefixSum[l]);
            console.log(`Alternating sum from ${l} to ${r} is ${alternatingSum}`); // Log result for type 2
            results.push(alternatingSum);
        }
    }

    return results;
}

async function main() {
    try {
        const { token, data, query } = await fetchData();
        const results = processQueries(data, query);
        await sendOutput(token, results);
        console.log('Results sent successfully:', results);
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
