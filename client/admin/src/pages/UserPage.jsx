import { useCallback, useState, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Message, Loader, Header, Segment, Grid, Label, Modal, Button, Menu, Container, Icon } from 'semantic-ui-react';
import { Form, Select } from 'formsy-semantic-ui-react';
import { toast } from 'react-toastify';

import { usePermissions, useAuth, api, useResource, PERSON_NAME_REGEX, PASSWORD_REGEX } from '@amamentaufn/client-core';

import { PostList } from '../components/PostList';

// ------------------------------------------------------------------------------------------------------------
// UsersPage Component
// ------------------------------------------------------------------------------------------------------------

export default function UserPage() {
  const { id } = useParams();
  const [user, isLoading, error] = useResource({ method: 'get', url: `/user/${id}` });
  const { user: authenticatedUser, hasPermission } = useAuth();

  const [selectedTab, setSelectedTab] = useState('details');
  const handleTabClick = useCallback((_, { name }) => setSelectedTab(name), []);

  if (isLoading) {
    return <Loader active inline='centered' />;
  } else if (error) {
    return error.renderErrorMessage();
  }

  const createdAt = new Date(user.createdAt);
  const isMe = user.id === authenticatedUser.id;

  // permissions
  const canManagePosts = isMe || hasPermission('CAN_MANAGE_ANY_POSTS');
  const canManagePermissions = hasPermission('CAN_MANAGE_USER_PERMISSIONS');
  const canManageUsers = hasPermission('CAN_MANAGE_USERS');

  let content = null;
  // eslint-disable-next-line default-case
  switch (selectedTab) {
    case 'details': {
      content = <UpdateUserAccountDetails user={user} />;
      break;
    }

    case 'password': {
      content = <UpdateUserPassword user={user} />;
      break;
    }

    case 'permissions': {
      content = <UpdateUserPermissions user={user} />;
      break;
    }

    case 'actions': {
      content = <UserActions user={user} canManagePosts={canManagePosts} />;
      break;
    }
  }

  return (
    <Fragment>
      <Header inverted block>
        <Icon name='user' />
        <Header.Content>
          {`${user.firstName} ${user.lastName}`}
          {isMe ? (
            <Label size='small' color='pink'>
              VOC??
            </Label>
          ) : null}
          <Header.Subheader>{`ID: ${user.id} CRIADO EM: ${createdAt.toLocaleString('pt-BR')}`}</Header.Subheader>
        </Header.Content>
      </Header>

      <Menu attached='top' tabular>
        <Menu.Item
          name='details'
          icon='info circle'
          content='Informa????es'
          active={selectedTab === 'details'}
          onClick={handleTabClick}
        />
        <Menu.Item
          name='password'
          icon='lock'
          content='Alterar Senha'
          active={selectedTab === 'password'}
          onClick={handleTabClick}
        />

        {canManagePermissions ? (
          <Menu.Item
            name='permissions'
            icon='address card'
            content='Gerenciar Permiss??es'
            active={selectedTab === 'permissions'}
            onClick={handleTabClick}
          />
        ) : null}

        {canManageUsers ? (
          <Menu.Item
            position='right'
            name='actions'
            icon='play circle'
            content='A????es'
            active={selectedTab === 'actions'}
            onClick={handleTabClick}
          />
        ) : null}
      </Menu>

      <Segment attached='bottom'>{content}</Segment>

      <Header
        attached='top'
        content={isMe ? 'Suas Publica????es' : 'Publica????es'}
        icon='list'
        subheader={isMe ? 'Lista de publica????es criadas por voc??.' : 'Lista de publica????es do usu??rio.'}
        dividing
        inverted
      />
      <PostList attached='bottom' itemsPerPage={5} filterAuthor={user.id} hideAuthor />
    </Fragment>
  );
}

// ------------------------------------------------------------------------------------------------------------
// UpdateUserPassword Component
// ------------------------------------------------------------------------------------------------------------

function UpdateUserPassword({ user }) {
  const inputErrorLabel = <Label color='red' pointing prompt />;
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdatePassword = useCallback(
    async ({ password }) => {
      try {
        setIsLoading(true);
        await toast.promise(api.patch(`/user/${user.id}`, { password }), {
          pending: 'Alternado senha...',
          success: 'Senha alterada com sucesso.',
          error: {
            render: function ({ data }) {
              return data.toString();
            }
          }
        });
      } catch (error) {}
      setIsLoading(false);
    },
    [user.id]
  );

  return (
    <Form loading={isLoading} onValidSubmit={handleUpdatePassword}>
      <Form.Input
        name='password'
        label='Nova Senha'
        placeholder='Senha'
        autoComplete='off'
        maxLength='32'
        errorLabel={inputErrorLabel}
        validations={{ matchRegexp: PASSWORD_REGEX }}
        validationErrors={{
          isDefaultRequiredValue: 'Campo obrigt??rio.',
          matchRegexp:
            'A senha deve ter de 8 a 32 caract??rios e contar pelo menos ' +
            'uma letr?? mai??scula, outra min??scula, um n??mero e um s??mbolo.'
        }}
        required
      />

      <Container textAlign='right'>
        <Form.Button type='submit' icon='save' labelPosition='right' content='Salvar Altera????es' positive />
      </Container>
    </Form>
  );
}

// ------------------------------------------------------------------------------------------------------------
// UpdateUserAccountDetails Component
// ------------------------------------------------------------------------------------------------------------

function UpdateUserAccountDetails({ user }) {
  const [isLoading, setIsLoading] = useState(false);

  const inputErrorLabel = <Label color='red' pointing prompt />;

  const handleUpdateUser = useCallback(
    async ({ firstName, lastName, email }) => {
      try {
        setIsLoading(true);
        await toast.promise(api.patch(`/user/${user.id}`, { firstName, lastName, email }), {
          pending: 'Atualizando...',
          success: 'Dados atualizados com sucesso.',
          error: {
            render: function ({ data }) {
              return data.toString();
            }
          }
        });
      } catch (error) {}
      setIsLoading(false);
    },
    [user.id]
  );

  return (
    <Form loading={isLoading} onValidSubmit={handleUpdateUser}>
      <Form.Input
        name='email'
        label='Email'
        placeholder='Email'
        maxLength='255'
        defaultValue={user.email}
        errorLabel={inputErrorLabel}
        validations={{ isEmail: true }}
        validationErrors={{
          isDefaultRequiredValue: 'Campo obrigt??rio.',
          isEmail: 'Endere??o de email inv??lido.'
        }}
        required
      />

      <Form.Group widths='equal'>
        <Form.Input
          name='firstName'
          label='Nome'
          placeholder='Nome'
          maxLength='32'
          errorLabel={inputErrorLabel}
          defaultValue={user.firstName}
          validations={{ matchRegexp: PERSON_NAME_REGEX }}
          validationErrors={{
            isDefaultRequiredValue: 'Campo obrigt??rio.',
            matchRegexp: 'Utilize apenas caracteres permitidos.'
          }}
          required
        />

        <Form.Input
          name='lastName'
          label='Sobrenome'
          placeholder='Sobrenome'
          maxLength='32'
          defaultValue={user.lastName}
          errorLabel={inputErrorLabel}
          validations={{ matchRegexp: PERSON_NAME_REGEX }}
          validationErrors={{
            isDefaultRequiredValue: 'Campo obrigt??rio.',
            matchRegexp: 'Utilize apenas caracteres permitidos.'
          }}
          required
        />
      </Form.Group>

      <Container textAlign='right'>
        <Form.Button type='submit' icon='save' labelPosition='right' content='Salvar Altera????es' positive />
      </Container>
    </Form>
  );
}

// ------------------------------------------------------------------------------------------------------------
// UpdateUserPermissions Component
// ------------------------------------------------------------------------------------------------------------

function UpdateUserPermissions({ user }) {
  const [availablePermissions, isPermissionsLoading, permissionsError, canManagePermisions] = usePermissions();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdatePermissions = useCallback(
    async ({ permissions }) => {
      try {
        setIsLoading(true);
        await toast.promise(api.patch(`/user/${user.id}/permissions`, { permissions }), {
          pending: 'Atualizando permiss??es...',
          success: 'Permiss??es atualizadas.',
          error: {
            render: function ({ data }) {
              return data.toString();
            }
          }
        });
      } catch (error) {}
      setIsLoading(false);
    },
    [user.id]
  );

  if (isPermissionsLoading) {
    return <Loader active inline='centered' />;
  }

  if (permissionsError) {
    if (!canManagePermisions) {
      return <Message content='Sem permiss??o suficiente para editar as permiss??es do usu??rio.' />;
    }
    return permissionsError.renderErrorMessage('Houve um erro ao carregar as permiss??es.');
  }

  const permissionsSelectOptions =
    availablePermissions?.map(({ identifier }) => {
      return {
        key: identifier,
        text: identifier,
        value: identifier
      };
    }) || [];

  return (
    <Form loading={isLoading} onValidSubmit={handleUpdatePermissions}>
      <Form.Field
        label='Permiss??es'
        name='permissions'
        control={Select}
        options={permissionsSelectOptions}
        placeholder='Permiss??es'
        defaultValue={user.permissions}
        noResultsMessage='Nenhuma resultado encontrado.'
        search
        multiple
        selection
      />

      <Container textAlign='right'>
        <Form.Button type='submit' icon='save' labelPosition='right' content='Salvar Altera????es' positive />
      </Container>
    </Form>
  );
}

// ------------------------------------------------------------------------------------------------------------
// UserActions Component
// ------------------------------------------------------------------------------------------------------------

function UserActions({ user, canManagePosts }) {
  const navigate = useNavigate();

  const handleDelete = useCallback(() => {
    const handleDeleteImpl = async () => {
      try {
        await toast.promise(api.delete(`/user/${user.id}`), {
          pending: 'Deletando usu??rio.',
          success: 'Usu??rio deletado com sucesso.',
          error: {
            render({ data }) {
              return data.toString();
            }
          }
        });
        navigate('/users');
      } catch (error) {}
    };
    handleDeleteImpl();
  }, [user.id, navigate]);

  return (
    <Grid>
      <Grid.Column>
        <Grid.Row>
          {canManagePosts ? (
            <Modal
              trigger={<Button icon='trash' labelPosition='right' content='Deletar Usu??rio' negative />}
              header='Certeza que deseja deletar este usu??rio?'
              content='Caso este usu??rio seja deletado, todas suas publica????es ser??o deletadas tamb??m.'
              actions={[
                {
                  key: 'cancel',
                  content: 'Cancelar',
                  icon: 'cancel'
                },
                {
                  key: 'done',
                  content: 'Sim',
                  negative: true,
                  icon: 'trash',
                  onClick: handleDelete
                }
              ]}
            />
          ) : null}
        </Grid.Row>
      </Grid.Column>
    </Grid>
  );
}
