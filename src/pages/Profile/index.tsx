import React, {useCallback, useRef} from 'react';
import { useAuth } from '../../hooks/auth'

import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert
}from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker/src';
import Icon from 'react-native-vector-icons/Feather';
import {useNavigation} from '@react-navigation/native';
import { Form } from '@unform/mobile';
import { FormHandles } from '@unform/core'
import * as Yup from 'yup';
import api from '../../services/api';

import getValidationErrors from '../../utils/getValidationErrors';
import Input from '../../components/Input';
import Button from '../../components/Button';

import {
  UserAvatarButton,
  UserAvatar,
  Container,
  ContainerHeader,
  Title,
  BackButton,
  LogoutButton
} from './styles';

interface ProfileFormData {
  name: string;
  email: string;
  password: string;
  old_password: string;
  password_confirmation: string;
}
const Profile: React.FC = () => {
  const {user, updateUser, signOut} = useAuth();

  const formRef = useRef<FormHandles>(null);
  const navigation = useNavigation();

  const emailInputRef = useRef<TextInput>(null)

  const oldPasswordInputRef = useRef<TextInput>(null)
  const passwordInputRef = useRef<TextInput>(null)
  const confirmPasswordInputRef = useRef<TextInput>(null)
  const handleSaveProfile = useCallback(async (data: ProfileFormData) => {
    try {
      formRef.current?.setErrors({});

      const schema = Yup.object().shape({
        name: Yup.string().required('Nome obrigatório'),
        email: Yup.string()
          .required('E-mail obrigatório')
          .email('Digite um e-mail válido'),
        old_password: Yup.string(),
        password: Yup.string().when('old_password', {
          is: (val) => !!val.length,
          then: Yup.string().required('Campo obrigatório'),
          otherwise: Yup.string(),
        }),
        password_confirmation: Yup.string()
          .when('old_password', {
            is: (val) => !!val.length,
            then: Yup.string().required('Campo obrigatório'),
            otherwise: Yup.string(),
          })
          .oneOf([Yup.ref('password'), null], 'Confirmação incorreta'),
      });

     
      await schema.validate(data, {
        abortEarly: false,
      });
      const {
        name,
        email,

        old_password,
        password,
        password_confirmation,
      } = data;

      const formData = {
        name,
        email,
        ...(old_password
          ? {
              old_password,
              password,
              password_confirmation,
            }
          : {}),
      };

    
      const response = await api.put('/profile', formData);
      updateUser(response.data);

      Alert.alert('Perfil atualizado com sucesso!');

      navigation.goBack();
    } catch (err) {
      if (err instanceof Yup.ValidationError) {
        const errors = getValidationErrors(err);

        formRef.current?.setErrors(errors);

        return;
      }

      Alert.alert(
        'Erro na Atualização',
        'Ocorreu um erro ao atualizar, tente novamente.',
      );
    }
  }, [navigation, updateUser]);

  const hendleGoBack = useCallback(()=> {
    navigation.goBack();
  },[navigation]); 
  
  const handleLogout = useCallback(()=> {
    signOut();
  },[]);

  const handleUpdateAvatar = useCallback(() => {
    const options = {
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
    };
      launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        return;
      } 
       if (response.error) {
       Alert.alert('Erro ao atualizar avatar');
       return;
      } 

      const source = { uri: response.uri}

      const data = new FormData();
      data.append('avatar', {
        type: 'image/jpeg',
        name: `${user.id}.jpg`,
        uri: response.uri
      });

      api.patch('users/avatar', data)
        .then(apiResponse => {
            updateUser(apiResponse.data)
        });

    })
  },[updateUser, user.id])

  return (
    <>
    <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : undefined }
    enabled
    >
    <ScrollView
    keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ flex: 1}}
    >
      <Container>
        <ContainerHeader>
        <BackButton onPress={hendleGoBack}>
          <Icon name="chevron-left" size={24} color="#999591"/>
        </BackButton>
        <LogoutButton onPress={handleLogout}>
          <Icon name="power" size={24} color="#999591"/>
        </LogoutButton>
        </ContainerHeader>
       
        <UserAvatarButton onPress={handleUpdateAvatar}>
            <UserAvatar source={{ uri: user.avatar_url }}/>
        </UserAvatarButton>
   
        <View>
          <Title>Meu perfil</Title>
        </View>
        <Form initialData={user} ref={formRef} onSubmit={handleSaveProfile}>
        <Input
          autoCapitalize="words"
          name="name"
          icon="user"
          placeholder="Nome"
          returnKeyType="next"
          onSubmitEditing={()=> {
            emailInputRef.current?.focus()
          }}
        />
        <Input
          ref={emailInputRef}
          autoCorrect={false}
          autoCapitalize="none"
          keyboardType="email-address"
          name="email"
          icon="mail"
          placeholder="E-mail"
          returnKeyType="next"
          onSubmitEditing={()=> {
            oldPasswordInputRef.current?.focus()
          }}
        />


        <Input
          ref={oldPasswordInputRef}
          secureTextEntry
          textContentType="newPassword"
          name="old_password"
          icon="lock"
          containerStyle={{ marginTop: 16 }}
          placeholder="Senha atual"
          returnKeyType="next"
          onSubmitEditing={() => {
            passwordInputRef.current?.focus()
            }}
        />

      <Input
          ref={passwordInputRef}
          secureTextEntry
          textContentType="newPassword"
          name="password"
          icon="lock"
          placeholder="Nova senha"
          returnKeyType="next"
          onSubmitEditing={() => {
            confirmPasswordInputRef.current?.focus()
            }}
        />  
        
        <Input
          ref={confirmPasswordInputRef}
          secureTextEntry
          textContentType="newPassword"
          name="password_confirmation"
          icon="lock"
          placeholder="Confirmar senha"
          returnKeyType="send"
          onSubmitEditing={() => {
            formRef.current?.submitForm()
            }}
        />  
  
        </Form>
        <Button onPress={() => {
             formRef.current?.submitForm()}}>
               Confirmar mudanças
      </Button>
    </Container>
  </ScrollView>
  </KeyboardAvoidingView>

    </>
  )
}

export default Profile;


