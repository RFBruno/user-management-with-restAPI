class UserController {

    constructor(formIdCreate, formIdUpdate, tableId) {
        this.formEl = document.getElementById(formIdCreate);
        this.formUpdateEl = document.getElementById(formIdUpdate);
        this.tableEl = document.getElementById(tableId);

        this.onSubmit();
        this.onEdit();
        this.selectAll();
    }
    
    //Metodo para edicao do usuario ao clicar no botao editar
    onEdit(){
        document.querySelector('#box-user-update .btn-cancel').addEventListener('click', e =>{
            this.showPanelCreate();
        });

        this.formUpdateEl.addEventListener('submit', event =>{
            event.preventDefault();

            let btn = this.formUpdateEl.querySelector('[type="submit"]');

            btn.disabled = true;
            
            let values = this.getValues(this.formUpdateEl);
            
            let index = this.formUpdateEl.dataset.trIndex;
            let tr = this.tableEl.rows[index];

            let userOld = JSON.parse(tr.dataset.user);

            let result = Object.assign({}, userOld, values);

            this.getPhoto(this.formUpdateEl).then((content) => {
                if(!values.photo){
                    result._photo = userOld._photo;
                }else{
                    result._photo = content;
                }

                let user = new User();
                user.loadFromJSON(result)

                user.save().then(user =>{

                    this.getTr(user, tr);        
                    

                    this.updateCount();

                    this.formUpdateEl.reset();
                    btn.disabled = false;
                    this.showPanelCreate();
                });

            }, (e) => {

                console.error(e);

            });
        })
    }

    //Metodo de envio do formulario para salvar o usuario criado
    onSubmit() {

        this.formEl.addEventListener('submit', event => {
            event.preventDefault();
            let btn = this.formEl.querySelector('[type="submit"]');

            btn.disabled = true;

            let values = this.getValues(this.formEl);

            if(!values) return false;

            this.getPhoto(this.formEl).then((content) => {

                values.photo = content;

                values.save().then(user => {                
                    this.addLine(user);

                    this.formEl.reset();
                    btn.disabled = false;

                } );
            },
            (e) => {

                console.error(e);

            });

        });

    }

    //Metodo para fazer a tratativa da foto inserida no formulario 
    getPhoto(formEl) {

        return new Promise((resolve, reject) => {

            let fileReader = new FileReader();

            let photoEl = [...formEl.elements].filter(el => {

                if (el.name === 'photo') {
                    return el;
                }
            });

            let file = photoEl[0].files[0];

            fileReader.onload = () => {
                //console.log(file)
                resolve(fileReader.result);
            }

            fileReader.onerror = e => {
                reject(e);
            }

            if (file) {
                fileReader.readAsDataURL(file);
            } else {
                resolve('./dist/img/boxed-bg.jpg');
            }

        });

    }

    //Metodo para tratativa e verificacao dos valores passados e campos obrigatorios
    getValues(formEl) {

        let user = {};
        let isValid = true;
        [...formEl.elements].forEach(el => {

            if (['name', 'email', 'password'].indexOf(el.name) > -1 && !el.value) {
                el.parentElement.classList.add('has-error');
                isValid = false;
            }

            if (el.name == 'gender') {
                if (el.checked)
                    user.gender = el.value;
            } else if (el.name === 'admin') {

                user[el.name] = el.checked;

            } else {
                user[el.name] = el.value;
            }

        });

        if (!isValid) {
            this.formEl.querySelector('[type="submit"]').disabled = false;
            return false;
        }

        ['name', 'email', 'password'].forEach(name => {
            document.querySelector(`[name='${name}']`).parentElement.classList.remove('has-error');
        });

        return new User(
            user.name,
            user.gender,
            user.birth,
            user.country,
            user.email,
            user.password,
            user.photo,
            user.admin
        );


    }

    //Metodo de busca dos usuarios armazenados
    selectAll(){
        
        User.getUsersStorage().then(data =>{
            data.users.forEach(dataUser =>{
                let user = new User();

                user.loadFromJSON(dataUser);
                
                this.addLine(user);
            }); 
        })
                    
    }

    //Metodo de inclusao das linhas na tabela
    addLine(dataUser) {
        let tr = this.getTr(dataUser);        

        this.tableEl.appendChild(tr);
        this.updateCount();
    }

    //Metodo de criacao das linhas da tabela com inclusao de seus dados
    getTr(dataUser, tr = null){
        if (tr === null) tr = document.createElement('tr');

        tr.dataset.user = JSON.stringify(dataUser);

        tr.innerHTML = `
                <td><img src="${dataUser.photo}" alt="User Image" class="img-circle img-sm"></td>
                <td>${dataUser.name}</td>
                <td>${dataUser.email}</td>
                <td>${dataUser.admin ? 'Sim' : 'Não'}</td>
                <td>${Utils.dateFormat(dataUser.register)}</td>
                <td>
                <button type="button" class="btn btn-primary btn-edit btn-xs btn-flat">Editar</button>
                <button type="button" class="btn btn-danger btn-delete btn-xs btn-flat">Excluir</button>
                </td> 
            `;
        this.addEventsTr(tr);
        return tr;
    }

    //Metodo de adicao dos eventos nos botoes de deletar e exclusao dos usuarios 
    addEventsTr(tr){

        tr.querySelector('.btn-delete').addEventListener('click', e=>{
            if(confirm('Deseja realmento excluir?')){
                
                let user = new User();

                user.loadFromJSON(JSON.parse(tr.dataset.user));

                user.remove().then(data =>{
                    tr.remove();
                    this.updateCount();
                })
                
            }
        })


        tr.querySelector('.btn-edit').addEventListener('click', e =>{
            let json = JSON.parse(tr.dataset.user);            
            
            this.formUpdateEl.dataset.trIndex = tr.sectionRowIndex;

            for(let name in json){
                let field = this.formUpdateEl.querySelector(`[name="${name.replace('_','')}"]`);
                if(field){
                    switch(field.type){
                        case 'file':
                            continue;
                        break;
                        case 'radio':
                            this.formUpdateEl.querySelector(`[name="${name.replace('_','')}"] [value=${json[name]}]`);
                            field.checked = true;
                        break;
                        case 'checkbox':
                            field.checked = json[name];
                        break;
                        default:
                            field.value = json[name];
                    }
                }
                
            }
            this.formUpdateEl.querySelector('.photo').src = json._photo;

            this.showPanelUpdate();
        })
    }

    //Metodo de mudaca de formulario de criacao para atualizacao
    showPanelUpdate(){
        document.getElementById("box-user-create").style.display = 'none';
        document.getElementById('box-user-update').style.display = 'block';
    }

    //Metodo de mudaca de formulario de atualizacao para criacao
    showPanelCreate(){
        document.getElementById("box-user-create").style.display = 'block';
        document.getElementById('box-user-update').style.display = 'none';
    }

    //Metodo de atualizao dos status de usuarios exitentes
    updateCount(){
        let numberUser = 0
        let numberAdm = 0;
        [...this.tableEl.children].forEach(tr =>{

            numberUser++;

            let user = JSON.parse(tr.dataset.user)
            
            if(user._admin) numberAdm++;
            
        });
        document.getElementById('number-users').innerText = numberUser;
        document.getElementById('number-users-adm').innerText = numberAdm;
    }

}