document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("form-publicacao");

  if (!form) {
    console.error("Formulário não encontrado!");
    return;
  }

  const supabase = window.supabase.createClient(
    'https://mweqqlfedkzshvkhurff.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13ZXFxbGZlZGt6c2h2a2h1cmZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMjUyMTksImV4cCI6MjA3MzkwMTIxOX0.jLSRC9SYqRQ7h2KmcyresQsF_zonuk_tjzwwhJjyW3c'
  );

  document.getElementById("form-publicacao").addEventListener("submit", async function (e) {
    e.preventDefault();

    const nome = document.getElementById("nomePet").value;
    const especie = document.getElementById("especiePet").value;
    const email = document.getElementById("email").value;
    const cidade = document.getElementById("cidade").value;
    const telefone = document.getElementById("telefone").value;
    const descricao = document.getElementById("descricao").value;
    const imagens = document.getElementById("imagens").files;

    let urls = [];

    for (let i = 0; i < imagens.length; i++) {
      const file = imagens[i];
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('pet-images')
        .upload(fileName, file);

      if (!error) {
        const url = supabase.storage
          .from('pet-images')
          .getPublicUrl(fileName).data.publicUrl;
        urls.push(url);
      } else {
        alert("Erro ao subir imagem: " + error.message);
        return;
      }
    }

    const { error: insertError } = await supabase
      .from('pets')
      .insert([{
        nome,
        especie,
        email,
        cidade,
        telefone,
        descricao,
        imagens: urls,
        adotado: false
      }]);

    if (!insertError) {
      alert("Pet publicado com sucesso!");
      document.getElementById("form-publicacao").reset();
      carregarPets();
      contarAdotados();
    } else {
      alert("Erro ao publicar pet.");
      console.log("Erro ao inserir:", insertError);
    }
  });

  async function validarAdocao(petId) {
    const { error } = await supabase
      .from('pets')
      .update({ adotado: true })
      .eq('id', petId);

    if (!error) {
      alert("Pet marcado como adotado!");
      carregarPets();
      contarAdotados();
    } else {
      alert("Erro ao validar adoção.");
      console.log("Erro:", error);
    }
  }

  async function carregarPets() {
  const { data: pets, error } = await supabase
    .from('pets')
    .select('*')
    .eq('adotado', false)
    .order('id', { ascending: false });

  const lista = document.querySelector(".lista-pets");
  lista.innerHTML = "";

  if (error || !pets || pets.length === 0) {
    lista.innerHTML = `<p class="mensagem-nenhum-pet">Nenhum pet encontrado.</p>`;
    console.warn("Erro ou nenhum pet:", error);
    return;
  }

  pets.forEach(pet => {
    const div = document.createElement("div");
    div.classList.add("pet-card");

    // Garante que imagens seja um array
    let imagensArray = [];
    if (Array.isArray(pet.imagens)) {
      imagensArray = pet.imagens;
    } else if (typeof pet.imagens === "string") {
      try {
        imagensArray = JSON.parse(pet.imagens);
      } catch (e) {
        imagensArray = [];
      }
    }

    const imagensHtml = imagensArray.length
      ? imagensArray.map(url => `<img src="${url}" alt="${pet.nome}" width="150">`).join("")
      : "";

    div.innerHTML = `
      <h3>${pet.nome}</h3>
      <p><strong>Espécie:</strong> ${pet.especie}</p>
      <p><strong>Descrição:</strong> ${pet.descricao || "Sem descrição"}</p>
      <p><strong>Cidade:</strong> ${pet.cidade}</p>
      <p><strong>Contato:</strong> ${pet.telefone} | ${pet.email}</p>
      <div class="imagens-pet">${imagensHtml}</div>
    `;

    const botao = document.createElement("button");
    botao.textContent = "Validar Adoção";
    botao.onclick = () => validarAdocao(pet.id);
    div.appendChild(botao);

    lista.appendChild(div);
  });

  console.log("Pets carregados:", pets);
}

  async function contarAdotados() {
    const { count, error } = await supabase
      .from('pets')
      .select('*', { count: 'exact', head: true })
      .eq('adotado', true);

    if (!error) {
      document.getElementById("contador-adotados").textContent = count;
    }
  }

  carregarPets();
  contarAdotados();
});