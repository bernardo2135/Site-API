
async function calcularFrete() {
    const cep = document.getElementById("cep").value
        .replace(/\D/g, "");
    const resultado = document.getElementById("resultado");

    if (cep.length !== 8) {
        resultado.innerHTML = "Digite um CEP válido com 8 números.";
        return;
    }

    resultado.innerHTML = "Consultando endereço e calculando frete...";

    try {
        // API pública ViaCEP
        const resposta = await fetch(
            `https://viacep.com.br/ws/${cep}/json/`
        );

        const endereco = await resposta.json();

        if (endereco.erro) {
            resultado.innerHTML = "CEP não encontrado.";
            return;
        }

        const cidade = endereco.localidade;
        const uf = endereco.uf;

        // Procura o endereço de destino no mapa
        const destinoTexto = [
            endereco.logradouro,
            endereco.bairro,
            cidade,
            uf,
            "Brasil"
        ].filter(Boolean).join(", ");

        const destino = await buscarCoordenadas(destinoTexto);

        // Procura a unidade da UNINASSAU em Fortaleza
        const faculdade = await buscarCoordenadas(
            "UNINASSAU Fortaleza Ceará Brasil"
        );

        if (!destino || !faculdade) {
            resultado.innerHTML = `
                <p>CEP: ${cep}</p>
                <p>Endereço: ${endereco.logradouro || "Não informado"}</p>
                <p>Bairro: ${endereco.bairro || "Não informado"}</p>
                <p>Cidade: ${cidade} - ${uf}</p>
                <p>Não foi possível localizar os pontos no mapa.
                Tente novamente mais tarde.</p>
            `;
            return;
        }

        // Distância geográfica em quilômetros
        const distancia = calcularDistancia(
            faculdade.lat,
            faculdade.lon,
            destino.lat,
            destino.lon
        );

        // Tarifa fictícia para fins acadêmicos
        const tarifaInicial = 4;
        const precoPorKm = 1.50;
        const estimativaMoto = tarifaInicial + distancia * precoPorKm;

        // Acréscimo para estimar o custo de uma rota por ruas
        const distanciaEstimada = distancia * 1.3;
        const frete = tarifaInicial +
            distanciaEstimada * precoPorKm;

        resultado.innerHTML = `
            <h3>Resultado da consulta</h3>
            <p><strong>CEP:</strong> ${cep}</p>
            <p><strong>Endereço:</strong>
            ${endereco.logradouro || "Não informado"}</p>
            <p><strong>Bairro:</strong>
            ${endereco.bairro || "Não informado"}</p>
            <p><strong>Cidade:</strong> ${cidade} - ${uf}</p>
            <hr>
            <p><strong>Origem:</strong> UNINASSAU - Fortaleza</p>
            <p><strong>Distância em linha reta:</strong>
            ${distancia.toFixed(2)} km</p>
            <p><strong>Distância estimada por ruas:</strong>
            ${distanciaEstimada.toFixed(2)} km</p>
            <p><strong>Estimativa de Uber Moto:</strong>
            R$ ${estimativaMoto.toFixed(2).replace(".", ",")}</p>
            <p><strong>Valor estimado do frete:</strong>
            R$ ${frete.toFixed(2).replace(".", ",")}</p>
            <small>
                Valores simulados para trabalho acadêmico.
                Não representam uma cotação real do Uber.
            </small>
        `;

    } catch (erro) {
        resultado.innerHTML =
            "Erro ao consultar as APIs. Verifique sua internet e tente novamente.";
    }
}

async function buscarCoordenadas(endereco) {
    const url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&q="
        + encodeURIComponent(endereco);

    const resposta = await fetch(url);
    const dados = await resposta.json();

    if (!dados.length) {
        return null;
    }

    return {
        lat: Number(dados[0].lat),
        lon: Number(dados[0].lon)
    };
}

function calcularDistancia(lat1, lon1, lat2, lon2) {
    const raioTerra = 6371;
    const rad = valor => valor * Math.PI / 180;

    const dLat = rad(lat2 - lat1);
    const dLon = rad(lon2 - lon1);

    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(rad(lat1)) *
        Math.cos(rad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    return raioTerra * 2 *
        Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
